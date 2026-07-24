# QuickBite

A three-sided food delivery platform for customers, restaurants, drivers, merchants, and admins.

## Structure

- `/mobile` - React Native + Expo mobile app
- `/web` - Next.js + Tailwind admin and merchant portal
- `/server` - Node.js + Express + Prisma API for Railway
- `/backend` - legacy Spring Boot + PostgreSQL fallback

## Deployment

- Mobile: Expo / EAS
- Web: Vercel or local Next.js
- Backend API: Railway
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

```bash
cd backend
./mvnw spring-boot:run
```

## Mobile

```bash
cd mobile
copy .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to the Railway backend URL before testing on phones.

## Web

```bash
cd web
copy .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the Railway backend URL.

## Railway + Neon Setup

1. Create a Neon Postgres database and copy the connection string with `sslmode=require`.
2. Create a Railway service from this repo with root directory `server`.
3. Add `DATABASE_URL`, `JWT_SECRET`, Paystack, Cloudinary, and `PUBLIC_BASE_URL` variables.
4. Deploy using the `server/railway.json` start command.
5. Run the mobile and web apps with their API URL env vars pointed at Railway.

## Demo Password

Seeded demo accounts use:

```text
AdminPassword2026!
```
