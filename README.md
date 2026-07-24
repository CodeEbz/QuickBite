# QuickBite

A three-sided food delivery platform for customers, restaurants, drivers, merchants, and admins.

## Structure

- `/mobile` - React Native + Expo mobile app
- `/web` - Next.js + Tailwind admin and merchant portal
- `/server` - Node.js + Express + Prisma API
- `/backend` - legacy Spring Boot reference only; do not deploy

## Deployment

- Mobile: Expo / EAS
- Web: Vercel or local Next.js
- Backend API: Node.js host TBD
- Database: Neon Postgres
- Images: Cloudinary recommended for durable uploads

## Node Backend

```bash
cd server
npm install
copy .env.example .env
npm run prisma:dev
npm run seed
npm run dev
```

## Legacy Java Backend

The Spring Boot backend is retained for reference only. The active backend is `/server`.

## Mobile

```bash
cd mobile
copy .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to the deployed Node backend URL before testing on phones.

## Web

```bash
cd web
copy .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the deployed Node backend URL.

## Neon Postgres Setup

1. Create a Neon project.
2. Copy the Neon Postgres connection string with `sslmode=require`.
3. Set `DATABASE_URL` on the Node backend host.
4. Run Prisma migrations with the direct Neon connection string.
5. Configure `JWT_SECRET`, Paystack, Cloudinary, `PUBLIC_BASE_URL`, and client origin variables on the backend host.
6. Run the mobile and web apps with their API URL env vars pointed at the deployed Node backend.

## Demo Password

Seeded demo accounts use:

```text
AdminPassword2026!
```
