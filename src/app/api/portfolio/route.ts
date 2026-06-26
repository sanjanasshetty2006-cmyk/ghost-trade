import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";
import TransactionModel from "@/models/Transaction";
import PortfolioSnapshotModel from "@/models/PortfolioSnapshot";
import { getUserFromRequest } from "@/lib/auth";
import { getQuote } from "@/lib/yahoo";

// ── Sector allocation ─────────────────────────────────────────────────────────
// Uses h.sector from the Holding document — written by trade/route.ts from
// real Yahoo Finance quoteSummary data. No hardcoded symbol map needed.
function getSectorAllocation(
  holdings: Array<{ sector: string; currentValue: number }>,
  total: number
): Record<string, number> {
  const sectors: Record<string, number> = {};
  for (const h of holdings) {
    const sector = h.sector || "Other";
    sectors[sector] = (sectors[sector] || 0) + h.currentValue;
  }
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(sectors)) {
    result[k] = total > 0 ? Math.round((v / total) * 100) : 0;
  }
  return result;
}

// ── Portfolio score ────────────────────────────────────────────────────────────
// 4-factor formula:
//   Diversification  40 pts  — 5 pts per unique sector, max 8 sectors
//   Concentration    30 pts  — penalises single-sector overweight
//   Performance      20 pts  — based on overall P&L %
//   Breadth          10 pts  — 1 pt per holding, max 10
function calcPortfolioScore(
  numSectors: number,
  maxSectorWeight: number,
  numHoldings: number,
  pnlPercent: number
): number {
  const diversityPts     = Math.min(numSectors * 5, 40);
  const concentrationPts = Math.round(Math.max(0, 30 - (maxSectorWeight - 30) * 0.75));
  const perfPts          = Math.min(20, Math.max(0, 10 + Math.round((pnlPercent / 5) * 2)));
  const breadthPts       = Math.min(numHoldings, 10);
  return Math.min(100, diversityPts + concentrationPts + perfPts + breadthPts);
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // ── Execute pending limit orders where price condition is met ─────────────
    const pendingLimitBuys = await TransactionModel.find({
      userId:    payload.userId,
      status:    "PENDING",
      orderType: "LIMIT",
      type:      "BUY",
    });

    const pendingStopLosses = await TransactionModel.find({
      userId:    payload.userId,
      status:    "PENDING",
      orderType: "STOP_LOSS",
      type:      "SELL",
    });

    for (const order of pendingLimitBuys) {
      const quote = await getQuote(order.symbol).catch(() => null);
      if (!quote?.price) continue;

      // Execute when market price drops to or below the limit price
      if (quote.price <= order.price) {
        const pUser = await UserModel.findById(payload.userId);
        if (!pUser) continue;

        const total = order.price * order.quantity;
        if (pUser.cashBalance < total) continue;

        const existing = await HoldingModel.findOne({ userId: payload.userId, symbol: order.symbol });
        if (existing) {
          const newQty      = existing.quantity + order.quantity;
          const newInvested = existing.totalInvested + total;
          existing.avgBuyPrice   = newInvested / newQty;
          existing.quantity      = newQty;
          existing.totalInvested = newInvested;
          await existing.save();
        } else {
          await HoldingModel.create({
            userId:        payload.userId,
            symbol:        order.symbol,
            companyName:   order.companyName,
            exchange:      "NSE",
            industry:      "Other",
            sector:        "Other",
            marketCap:     0,
            quantity:      order.quantity,
            avgBuyPrice:   order.price,
            totalInvested: total,
          });
        }

        pUser.cashBalance -= total;
        await pUser.save();

        order.status = "EXECUTED";
        await order.save();
      }
    }

    for (const order of pendingStopLosses) {
      const quote = await getQuote(order.symbol).catch(() => null);
      if (!quote?.price) continue;

      // Execute when market price drops to or below the stop loss trigger price
      if (quote.price <= order.price) {
        const pUser = await UserModel.findById(payload.userId);
        if (!pUser) continue;

        const holding = await HoldingModel.findOne({ userId: payload.userId, symbol: order.symbol });
        if (!holding || holding.quantity < order.quantity) {
          order.status = "CANCELLED";
          await order.save();
          continue;
        }

        const total      = order.price * order.quantity;
        const pnl        = (order.price - holding.avgBuyPrice) * order.quantity;
        const remainQty  = holding.quantity - order.quantity;

        if (remainQty === 0) {
          await HoldingModel.deleteOne({ _id: holding._id });
        } else {
          holding.quantity      = remainQty;
          holding.totalInvested = holding.avgBuyPrice * remainQty;
          await holding.save();
        }

        pUser.cashBalance += total;
        await pUser.save();

        order.status = "EXECUTED";
        order.pnl    = pnl;
        await order.save();
      }
    }

    // ── Load user + holdings ──────────────────────────────────────────────────
    const [user, holdings] = await Promise.all([
      UserModel.findById(payload.userId).select("-password"),
      HoldingModel.find({ userId: payload.userId }),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // ── Enrich holdings with live prices ──────────────────────────────────────
    // industry and sector come from the Holding document (saved at buy time from Yahoo).
    // We do NOT re-fetch metadata on every portfolio load — that would be too slow.
    const enriched = await Promise.all(
      holdings.map(async (h: typeof holdings[0]) => {
        let currentPrice = h.avgBuyPrice;

        const quote = await getQuote(h.symbol).catch(() => null);
        if (quote?.price && quote.price > 0) {
          currentPrice = quote.price;
        }

        console.log(`[portfolio] ${h.symbol} BUY: ${h.avgBuyPrice} LIVE: ${quote?.price} USED: ${currentPrice}`);

        const currentValue = currentPrice * h.quantity;
        const pnl          = currentValue - h.totalInvested;
        const pnlPercent   = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;

        return {
          _id:           h._id.toString(),
          symbol:        h.symbol,
          companyName:   h.companyName,
          exchange:      h.exchange,
          // Use what Yahoo gave us at buy time. Fall back to "Other" never "Unknown".
          industry:      h.industry || "Other",
          sector:        h.sector   || "Other",
          marketCap:     h.marketCap ?? 0,
          quantity:      h.quantity,
          avgBuyPrice:   h.avgBuyPrice,
          currentPrice,
          currentValue,
          totalInvested: h.totalInvested,
          pnl,
          pnlPercent,
        };
      })
    );

    type EnrichedHolding = typeof enriched[0];

    const totalInvested        = enriched.reduce((s: number, h: EnrichedHolding) => s + h.totalInvested, 0);
    const currentInvestedValue = enriched.reduce((s: number, h: EnrichedHolding) => s + h.currentValue, 0);
    const totalPortfolioValue  = user.cashBalance + currentInvestedValue;
    const unrealizedPnl        = currentInvestedValue - totalInvested;

    // Realized P&L: sum of pnl on all completed SELL transactions
    const allSellTx = await TransactionModel.find({
      userId: payload.userId,
      type:   "SELL",
      status: "EXECUTED",
    }).select("pnl");
    const realizedPnl = allSellTx.reduce(
      (s: number, t: typeof allSellTx[0]) => s + (t.pnl ?? 0), 0
    );

    const totalPnl   = realizedPnl + unrealizedPnl;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    // ── Sector allocation — uses h.sector from DB ─────────────────────────────
    const sectorAlloc = getSectorAllocation(enriched, currentInvestedValue);

    const numSectors           = Object.keys(sectorAlloc).length;
    const maxSectorWeight      = currentInvestedValue > 0
      ? Math.max(...Object.values(sectorAlloc), 0)
      : 0;
    const diversificationScore = Math.min(numSectors * 12, 100);
    const riskScore            = Math.min(maxSectorWeight, 100);
    const portfolioScore       = enriched.length === 0
      ? 0
      : calcPortfolioScore(numSectors, maxSectorWeight, enriched.length, pnlPercent);

    // ── Today's P&L ───────────────────────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTx  = await TransactionModel.find({
      userId:    payload.userId,
      createdAt: { $gte: todayStart },
      status:    "EXECUTED",
    });
    const todayPnl = todayTx.reduce(
      (s: number, t: typeof todayTx[0]) => s + (t.pnl ?? 0), 0
    );

    // ── Save daily snapshot ───────────────────────────────────────────────────
    const snapshotDay = new Date();
    snapshotDay.setHours(0, 0, 0, 0);

    await PortfolioSnapshotModel.findOneAndUpdate(
      { userId: payload.userId, date: { $gte: snapshotDay } },
      {
        totalValue:    totalPortfolioValue,
        cashBalance:   user.cashBalance,
        investedValue: currentInvestedValue,
        pnl:           totalPnl,
        pnlPercent,
        date:          new Date(),
      },
      { upsert: true, new: true }
    );

    // ── All snapshots for chart ────────────────────────────────────────────────
    const snapshots = await PortfolioSnapshotModel.find({
      userId: payload.userId,
    }).sort({ date: 1 });

    // ── Pending orders for dashboard display ──────────────────────────────────
    const stillPending = await TransactionModel.find({
      userId: payload.userId,
      status: "PENDING",
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        holdings:            enriched,
        cashBalance:         user.cashBalance,
        totalInvested,
        currentValue:        currentInvestedValue,
        totalPortfolioValue,
        totalPnl,
        realizedPnl,
        unrealizedPnl,
        todayPnl,
        pnlPercent,
        portfolioScore,
        diversificationScore,
        riskScore,
        sectorAllocation:    sectorAlloc,
        startingBalance:     1_000_000,
        overallReturn:       ((totalPortfolioValue - 1_000_000) / 1_000_000) * 100,
        weeklyPnlHistory:    snapshots.map((s: typeof snapshots[0]) => ({
          date: s.date,
          pnl:  s.pnl,
        })),
        pendingOrders: stillPending.map((o: typeof stillPending[0]) => ({
          _id:       o._id.toString(),
          symbol:    o.symbol,
          type:      o.type,
          orderType: o.orderType,
          quantity:  o.quantity,
          price:     o.price,
          total:     o.total,
          status:    o.status,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("[portfolio] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}