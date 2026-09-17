# V-Pay-wallet (Next.js — Vercel Ready)

Frontend + Secure Backend in one Next.js project.

## Features

**Frontend**
- PIN Lock (demo: `1234`)
- Home, Send, Receive, Add Money, History, Transaction Detail
- English + Urdu
- Professional dark UI

**Backend (API Routes)**
- OTP Auth + JWT (Access + Refresh)
- Wallet: balance, transactions, send, add-money
- PIN hashing (bcrypt)
- JazzCash / EasyPaisa / Bank adapters (sandbox)
- Input validation (Zod)

## Demo Credentials

| Item        | Value            |
|-------------|------------------|
| App PIN     | 1234             |
| OTP         | 123456           |
| Demo Phone  | +923001234567    |

## Local Run

```bash
npm install
npm run dev
```

Open: http://localhost:3000  
(redirects to wallet UI)

API Health: http://localhost:3000/api/health

## Deploy on Vercel (Step by Step)

1. Create a **new GitHub repository** (empty).
2. Push this project:
   ```bash
   git init
   git add .
   git commit -m "Vortex Wallet Next.js"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) → **Add New Project**
4. Import the GitHub repo
5. Framework Preset: **Next.js** (auto-detected)
6. Environment Variables (optional but recommended):
   - `JWT_ACCESS_SECRET` = long random string
   - `JWT_REFRESH_SECRET` = another long random string
   - `DEMO_OTP_ENABLED` = true
   - `DEMO_OTP_CODE` = 123456
7. Click **Deploy**

Done. Aapko ek URL milega jaise `https://vortex-xxx.vercel.app`

## API Endpoints

| Method | Path                         | Auth |
|--------|------------------------------|------|
| GET    | /api/health                  | No   |
| POST   | /api/auth/otp/request        | No   |
| POST   | /api/auth/otp/verify         | No   |
| POST   | /api/auth/refresh            | No   |
| POST   | /api/auth/logout             | Yes  |
| GET    | /api/wallet/balance          | Yes  |
| GET    | /api/wallet/transactions     | Yes  |
| POST   | /api/wallet/send             | Yes  |
| POST   | /api/wallet/add-money        | Yes  |
| GET    | /api/wallet/profile          | Yes  |

Auth header: `Authorization: Bearer <accessToken>`

## Important Notes

- In-memory store (serverless pe har cold start pe reset ho sakta hai). Production mein PostgreSQL lagana hoga.
- JazzCash / EasyPaisa abhi **sandbox** hain. Real keys baad mein `.env` mein daalna.
- Real money ke liye SBP EMI license / partnership zaroori hai.

## Next Steps After Deploy

1. Test PIN + flows on live URL
2. Frontend ko API se connect karna (abhi mock data use ho raha hai UI mein)
3. Database add karna
4. Real payment provider keys
