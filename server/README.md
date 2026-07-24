# QuickBite Node API

Node.js replacement backend for QuickBite, designed for a hosted Node runtime + Neon Postgres.

## Local Setup

```bash
cd server
npm install
copy .env.example .env
npm run prisma:dev
npm run seed
npm run dev
```

## Railway backend deployment

Use Railway for the Node backend only. Keep Neon as the database.

Railway settings:

- Root directory: `server`
- Build: Nixpacks / automatic
- Start command: from `railway.json`, `npm run prisma:migrate && npm start`
- Health check path: `/health`

Set these Railway variables:

- `NODE_ENV=staging` for testing without Paystack/Cloudinary; use `production` only after real secrets are configured
- `DATABASE_URL=<Neon connection string>`
- `JWT_SECRET=<long random secret>`
- `AUTH_AUTO_VERIFY_SIGNUPS=true` for team testing
- `PAYSTACK_BASE_URL=https://api.paystack.co`
- `PAYSTACK_CURRENCY=NGN`
- `PUBLIC_BASE_URL=<Railway public backend URL>`
- `APP_BASE_URL=quickbite://payment-callback`
- `WEB_ORIGIN=<deployed web URL or http://localhost:3000 while testing>`
- `DELIVERY_FEE=2.5`
- `TAX_RATE=0.08`

Do not add a Railway Postgres service unless you intentionally want to replace Neon.

## Neon Postgres Setup

Create a Neon Postgres project, then set these variables on the Node backend host:

- `DATABASE_URL`: Neon Postgres connection string with `sslmode=require`
- `JWT_SECRET`: long random secret
- `AUTH_AUTO_VERIFY_SIGNUPS`: `true` for team testing, `false` for OTP flow
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_BASE_URL`: `https://api.paystack.co`
- `PAYSTACK_CURRENCY`: `NGN`
- `PUBLIC_BASE_URL`: deployed Node backend URL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `DELIVERY_FEE`: checkout delivery fee, defaults to `2.5`
- `TAX_RATE`: checkout tax rate, defaults to `0.08`

Backend start command:

```bash
npm start
```

Railway deployment uses `railway.json` and runs Prisma migrations before starting the app.

## Prisma migration note

If Neon provides both pooled and direct URLs, use the direct URL for migrations and the pooled URL for runtime only after confirming Prisma compatibility for the selected host.

Run seed manually only when demo data is desired:

```bash
npm run seed
```

## Demo Password

All seeded demo accounts use:

```text
AdminPassword2026!
```
