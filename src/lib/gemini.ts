// Gemini 2.0 Flash via REST API (no SDK needed)
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
console.log("GEMINI KEY EXISTS:", !!GEMINI_KEY);
console.log("GEMINI KEY LENGTH:", GEMINI_KEY.length);
async function callGemini(prompt: string): Promise<string> {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();

      console.error("================================");
      console.error("GEMINI STATUS:", res.status);
      console.error("GEMINI ERROR:", errorText);
      console.error("================================");

      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = await res.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Unable to generate response."
    );
  } catch (err) {
    console.error("Gemini error:", err);

    return "Ghost AI is temporarily unavailable. Please try again shortly.";
  }
}

export async function askGhostAI(
  userMessage: string,
  portfolioContext?: string
): Promise<string> {
  const systemPart = `You are Ghost AI, the AI trading coach for Ghost Trade — a premium paper trading platform for Indian markets.

Personality: expert, concise, data-driven. Give actionable insights. Reference Indian markets (NSE, BSE, NIFTY, SENSEX). Use ₹ for rupee values. Format with bullet points when listing. Keep responses under 200 words unless asked for a full report. Always mention risk alongside opportunities.

${portfolioContext ? `Current portfolio context:\n${portfolioContext}\n` : ""}`;

  return callGemini(`${systemPart}\n\nUser: ${userMessage}\n\nGhost AI:`);
}

export async function generatePortfolioReport(
  reportType: "health" | "weekly" | "monthly" | "risk" | "diversification",
  portfolioData: string
): Promise<string> {
  const prompts: Record<string, string> = {
    health:          "Generate a comprehensive portfolio health report with: overall score out of 100, key strengths, weaknesses, top holdings analysis, and 3 specific actionable recommendations.",
    weekly:          "Generate a weekly portfolio review with: performance summary, best/worst performers this week, market events impact, and strategy for next week.",
    monthly:         "Generate a monthly portfolio review with: returns vs NIFTY50 benchmark, sector performance breakdown, portfolio evolution, and next month strategy.",
    risk:            "Generate a detailed risk analysis with: concentration risk, market beta, sector exposure risk, volatility assessment, and specific risk-reduction strategies.",
    diversification: "Generate a diversification report with: current sector allocation breakdown, correlation analysis, missing sectors, and 3-5 specific Indian stocks to add for better diversification.",
  };

  const prompt = `Keep responses under 150 words.

Use sections:
Summary
Risk
Recommendation

When discussing stocks, provide:
• Bullish factors
• Bearish factors
• Risk score out of 10
• Clear action (Buy, Hold, Watch, Reduce)

Be specific and avoid generic financial advice.

If the user asks non-financial questions, answer normally in a helpful and professional manner.

Do not force stock analysis when it is not relevant.

Do not respond sarcastically, mock the user, or refuse harmless questions.

For greetings, casual conversation, learning, platform features, portfolio explanations, trading concepts, contests, XP, levels, and app-related questions, answer naturally while maintaining the Ghost AI personality.

If information is unavailable, clearly say what is missing instead of inventing facts.

Prioritize the user's actual question over the portfolio context when the question is unrelated to investing. 

Task: ${prompts[reportType]}

Portfolio Data:
${portfolioData}

Format the report with clear sections using markdown-style headers. Use ₹ for Indian Rupee values. Make every recommendation specific and actionable. Reference relevant Indian market context.`;

  return callGemini(prompt);
}

export async function analyzeTradePostExecution(
  symbol: string,
  type: "BUY" | "SELL",
  quantity: number,
  price: number,
  portfolioContext: string
): Promise<string> {
  const prompt = `As Ghost AI trading coach for Indian markets, briefly analyze this paper trade:
${type} ${quantity} shares of ${symbol} at ₹${price.toLocaleString("en-IN")}

Portfolio context: ${portfolioContext}

Provide in under 100 words:
1. What was smart about this decision (1-2 points)
2. What to watch out for (1 point)  
3. Risk score: X/10
4. One specific follow-up action

Be direct and actionable. Reference Indian market conditions where relevant.`;

  return callGemini(prompt);
}
