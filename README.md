# 👻 Ghost Trade — Master the Market

AI-powered paper trading platform. Trade Indian stocks with ₹10,00,000 virtual cash.

## Stack
- Next.js 15 (App Router) · TypeScript · Tailwind CSS
- MongoDB Atlas · Built-in Node.js crypto (no bcrypt/JWT libs needed)
- Finnhub API (live market data) · Gemini 2.0 Flash REST API (Ghost AI)
- Chart.js · Framer Motion · Zustand

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (already set in .env.local)
# MONGODB_URI, JWT_SECRET, FINNHUB_API_KEY, GEMINI_API_KEY

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

## Environment Variables (.env.local)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-32-chars-min
FINNHUB_API_KEY=your_finnhub_key
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Pages & Routes
| Page | Route | Auth |
|------|-------|------|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Signup | `/signup` | Public |
| Dashboard | `/dashboard?page=dashboard` | Protected |
| Markets | `/dashboard?page=market` | Protected |
| Trade | `/dashboard?page=trade` | Protected |
| Ghost AI | `/dashboard?page=ai` | Protected |
| Leaderboard | `/dashboard?page=lb` | Protected |
| Learning | `/dashboard?page=learn` | Protected |
| Settings | `/dashboard?page=settings` | Protected |

## API Routes
```
POST /api/auth/signup         — Create account (gets ₹10L cash)
POST /api/auth/login          — Login, returns JWT
GET  /api/auth/me             — Get current user
DEL  /api/auth/me             — Logout (clears cookie)

GET  /api/portfolio           — Full portfolio with live P&L
GET  /api/holdings            — Raw holdings list
GET  /api/transactions        — Transaction history

POST /api/trade               — Execute BUY or SELL
     body: { symbol, type, orderType, quantity, limitPrice, companyName }

GET  /api/watchlist           — Get watchlist
POST /api/watchlist           — Add to watchlist
DEL  /api/watchlist           — Remove from watchlist

GET  /api/market/quote?symbol=TCS&type=quote     — Live quote
GET  /api/market/quote?symbol=TCS&type=candles   — OHLCV candle data
GET  /api/market/quote?symbol=TCS&type=profile   — Company profile
GET  /api/market/search?q=infosys                — Search stocks
GET  /api/market/trending                        — All stocks + gainers/losers
GET  /api/market/news                            — Market news

POST /api/ai/chat             — Ghost AI chat (Gemini)
     body: { message: string }
POST /api/ai/report           — Generate AI report
     body: { reportType: "health"|"weekly"|"monthly"|"risk"|"diversification" }

GET  /api/leaderboard         — Global rankings
PATCH /api/user/settings      — Update profile/ghostMode
```

## Key Design Decisions
- **No bcryptjs** — Uses Node.js built-in `crypto.pbkdf2Sync` (PBKDF2/SHA-512, 100k iterations)
- **No jsonwebtoken** — Uses Node.js built-in `crypto.createHmac` (HS256 JWT)
- **No axios** — Uses native `fetch()` for all HTTP calls
- **No @google/generative-ai SDK** — Calls Gemini REST API directly
- **Mongoose** — Only external DB dependency

## Deploy to Vercel
```bash
npm install -g vercel
vercel --env MONGODB_URI=... --env JWT_SECRET=... --env FINNHUB_API_KEY=... --env GEMINI_API_KEY=...
```

## Features
- ✅ Splash screen with pixel logo animation (Framer Motion)
- ✅ JWT auth (signup/login/logout/protected routes)
- ✅ Paper trading engine (buy/sell/holdings/P&L)
- ✅ Live market data via Finnhub (with mock fallback)
- ✅ Ghost AI powered by Gemini 2.0 Flash REST API
- ✅ Portfolio analytics (score, diversification, risk, sector allocation)
- ✅ Leaderboard with Ghost Mode anonymity
- ✅ Learning hub with XP system and achievements
- ✅ Watchlist management
- ✅ Framer Motion page transitions & animations
- ✅ Dark theme matching original HTML design exactly
