import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";
import TransactionModel from "@/models/Transaction";
import { getUserFromRequest } from "@/lib/auth";
import { getQuote, getCompanyProfile } from "@/lib/yahoo";

const ACHIEVEMENTS: Record<string, { title: string; xp: number; condition: (t: number) => boolean }> = {
  first_trade:  { title: "First Trade", xp: 100,  condition: (t) => t === 1  },
  ten_trades:   { title: "10 Trades",   xp: 500,  condition: (t) => t === 10 },
  fifty_trades: { title: "50 Trades",   xp: 2000, condition: (t) => t === 50 },
};

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const {
      symbol, type, orderType = "MARKET", quantity,
      limitPrice, companyName, exchange,
    } = await req.json() as {
      symbol: string; type: string; orderType?: string;
      quantity: number; limitPrice?: number;
      companyName?: string; exchange?: string;
    };

    if (!symbol || !type || !quantity || quantity < 1) {
      return NextResponse.json({ success: false, error: "Invalid trade parameters" }, { status: 400 });
    }
    if (!["BUY", "SELL"].includes(type)) {
      return NextResponse.json({ success: false, error: "Type must be BUY or SELL" }, { status: 400 });
    }

    // ── Fetch live price ───────────────────────────────────────────────────────
    const quote = await getQuote(symbol);
    if (!quote?.price || quote.price <= 0) {
      return NextResponse.json(
        { success: false, error: "Could not fetch live stock price" },
        { status: 400 }
      );
    }
    const marketPrice = quote.price;

    let price: number;
    if (orderType === "LIMIT" || orderType === "STOP_LOSS") {
      price = Number(limitPrice);
    } else {
      price = marketPrice;
    }

    if (orderType === "LIMIT") {
      const minPrice = marketPrice * 0.9;
      const maxPrice = marketPrice * 1.1;
      if (price < minPrice || price > maxPrice) {
        return NextResponse.json(
          { success: false, error: `Limit price must be between ₹${minPrice.toFixed(2)} and ₹${maxPrice.toFixed(2)}` },
          { status: 400 }
        );
      }
    }

    if (!price || price <= 0) {
      return NextResponse.json({ success: false, error: "Invalid price" }, { status: 400 });
    }

    // ── Fetch real company metadata from Yahoo Finance ─────────────────────────
    // getCompanyProfile() calls /v11/finance/quoteSummary with assetProfile module
    // which returns real industry and sector. Falls back to "Other" if unavailable.
    // This runs in parallel with other setup work to minimise latency.
    const profilePromise = getCompanyProfile(symbol);

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const total = price * quantity;

    // ── STOP_LOSS: create pending order ───────────────────────────────────────
    if (orderType === "STOP_LOSS") {
      const holding = await HoldingModel.findOne({ userId: payload.userId, symbol: symbol.toUpperCase() });
      if (!holding || holding.quantity < quantity) {
        return NextResponse.json(
          { success: false, error: "Insufficient holdings for stop loss" },
          { status: 400 }
        );
      }

      await TransactionModel.create({
        userId:      payload.userId,
        symbol:      symbol.toUpperCase(),
        companyName: companyName ?? quote.companyName ?? symbol,
        type:        "SELL",
        orderType:   "STOP_LOSS",
        quantity,
        price,
        total,
        status:      "PENDING",
      });

      return NextResponse.json({
        success: true,
        data:    { status: "PENDING", cashBalance: user.cashBalance, price, total },
        message: "Stop Loss Order Placed",
      });
    }

    // ── LIMIT BUY: create pending order ───────────────────────────────────────
    if (type === "BUY" && orderType === "LIMIT") {
      if (user.cashBalance < total) {
        return NextResponse.json(
          { success: false, error: `Insufficient balance. Need ₹${total.toLocaleString("en-IN")}` },
          { status: 400 }
        );
      }

      await TransactionModel.create({
        userId:      payload.userId,
        symbol:      symbol.toUpperCase(),
        companyName: companyName ?? quote.companyName ?? symbol,
        type:        "BUY",
        orderType:   "LIMIT",
        quantity,
        price,
        total,
        status:      "PENDING",
      });

      return NextResponse.json({
        success: true,
        data:    { status: "PENDING", cashBalance: user.cashBalance, price, total },
        message: "Limit Order Placed",
      });
    }

    // ── MARKET BUY ────────────────────────────────────────────────────────────
    let pnl: number | undefined;

    if (type === "BUY") {
      if (user.cashBalance < total) {
        return NextResponse.json(
          { success: false, error: `Insufficient balance. Need ₹${total.toLocaleString("en-IN")}` },
          { status: 400 }
        );
      }

      // Resolve real company metadata — await the profile fetch started earlier
      const profile = await profilePromise;
      const realIndustry  = profile?.industry  ?? "Other";
      const realSector    = profile?.sector    ?? "Other";
      const realMarketCap = profile?.marketCap ?? quote.marketCap ?? 0;
      const realName      = profile?.name ?? quote.companyName ?? companyName ?? symbol;
      const realExchange  = profile?.exchange ?? quote.exchange ?? exchange ?? "NSE";

      console.log(
        `[trade] BUY ${symbol} → industry: ${realIndustry}, sector: ${realSector}, marketCap: ${realMarketCap}`
      );

      const existing = await HoldingModel.findOne({ userId: payload.userId, symbol: symbol.toUpperCase() });

      if (existing) {
        const newQty      = existing.quantity + quantity;
        const newInvested = existing.totalInvested + total;

        existing.avgBuyPrice   = newInvested / newQty;
        existing.quantity      = newQty;
        existing.totalInvested = newInvested;
        // Update metadata with latest values from Yahoo on each buy
        existing.companyName = realName;
        existing.industry    = realIndustry;
        existing.sector      = realSector;
        existing.marketCap   = realMarketCap;
        existing.exchange    = realExchange;

        await existing.save();
      } else {
        await HoldingModel.create({
          userId:        payload.userId,
          symbol:        symbol.toUpperCase(),
          companyName:   realName,
          exchange:      realExchange,
          industry:      realIndustry,
          sector:        realSector,
          marketCap:     realMarketCap,
          quantity,
          avgBuyPrice:   price,
          totalInvested: total,
        });
      }

      user.cashBalance -= total;

    // ── MARKET SELL ───────────────────────────────────────────────────────────
    } else {
      const holding = await HoldingModel.findOne({ userId: payload.userId, symbol: symbol.toUpperCase() });
      if (!holding || holding.quantity < quantity) {
        return NextResponse.json(
          { success: false, error: "Insufficient holdings to sell" },
          { status: 400 }
        );
      }

      pnl = (price - holding.avgBuyPrice) * quantity;

      const newQty = holding.quantity - quantity;
      if (newQty === 0) {
        await HoldingModel.deleteOne({ _id: holding._id });
      } else {
        holding.quantity       = newQty;
        holding.totalInvested  = holding.avgBuyPrice * newQty;
        await holding.save();
      }

      user.cashBalance += total;
    }

    // ── Record transaction + achievements ─────────────────────────────────────
    user.totalTrades += 1;

    const tx = await TransactionModel.create({
      userId:      payload.userId,
      symbol:      symbol.toUpperCase(),
      companyName: companyName ?? quote.companyName ?? symbol,
      type,
      orderType,
      quantity,
      price,
      total,
      pnl,
      status: "EXECUTED",
    });

    const earned: string[] = [];
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      if (!user.achievements.includes(id) && ach.condition(user.totalTrades)) {
        user.achievements.push(id);
        user.xp    += ach.xp;
        user.level  = Math.floor(user.xp / 500) + 1;
        earned.push(ach.title);
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: { transaction: tx, cashBalance: user.cashBalance, achievementsEarned: earned, price, total },
    });
  } catch (err) {
    console.error("[trade] error:", err);
    return NextResponse.json({ success: false, error: "Trade execution failed" }, { status: 500 });
  }
}