# QuickBite Node API

Node.js replacement backend for QuickBite, designed for Railway + Neon Postgres.

## Local Setup

```bash
cd server
npm install
copy .env.example .env
npm run prisma:dev
npm run seed
npm run dev
```

## Railway Setup

Set the Railway root directory to `server` and add these variables:

- `DATABASE_URL`: Neon Postgres connection string with `sslmode=require`
- `JWT_SECRET`: long random secret
- `AUTH_AUTO_VERIFY_SIGNUPS`: `true` for team testing, `false` for OTP flow
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_BASE_URL`: `https://api.paystack.co`
- `PAYSTACK_CURRENCY`: `NGN`
- `PUBLIC_BASE_URL`: Railway public backend URL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Railway start command:

```bash
npm run prisma:migrate && npm run seed && npm start
```

## Demo Password

All seeded demo accounts use:

```text
AdminPassword2026!
```
