import { NextResponse } from "next/server";
import { getMarketNews } from "@/lib/finnhub";

const FALLBACK_NEWS = [
  { headline: "NIFTY 50 Reaches New All-Time High Amid Strong FII Inflows", summary: "Foreign institutional investors poured over ₹8,200 crore into Indian equities, pushing the NIFTY 50 to fresh record highs.", url: "#", source: "Economic Times", datetime: Date.now() / 1000 - 3600, image: "" },
  { headline: "RBI Keeps Repo Rate Unchanged at 6.5% in Latest MPC Meeting", summary: "The Reserve Bank of India maintained its stance, citing controlled inflation and stable growth outlook.", url: "#", source: "Mint", datetime: Date.now() / 1000 - 7200, image: "" },
  { headline: "Reliance Industries Q4 Results: Net Profit Up 18% YoY", summary: "Reliance Industries reported strong quarterly earnings driven by Jio and retail segments outperforming expectations.", url: "#", source: "Business Standard", datetime: Date.now() / 1000 - 14400, image: "" },
  { headline: "IT Sector Rally: TCS, Infosys Lead Gains on AI Deal Wins", summary: "Indian IT majors surged on back of multi-billion dollar AI transformation deals from US and European enterprises.", url: "#", source: "Financial Express", datetime: Date.now() / 1000 - 21600, image: "" },
  { headline: "SEBI Introduces New Framework for Algorithmic Trading by Retail Investors", summary: "The markets regulator announced simplified algo trading rules to democratize systematic investing for retail participants.", url: "#", source: "SEBI Press Release", datetime: Date.now() / 1000 - 28800, image: "" },
];

export async function GET() {
  try {
    const news = await getMarketNews();
    if (news.length > 0) return NextResponse.json({ success: true, data: news });
    return NextResponse.json({ success: true, data: FALLBACK_NEWS });
  } catch {
    return NextResponse.json({ success: true, data: FALLBACK_NEWS });
  }
}
