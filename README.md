# QuickBite

QuickBite is a full-stack food delivery platform for customers, restaurant merchants, drivers, and administrators. The project contains a mobile app, a web admin/merchant portal, and a production API connected to a Postgres database.

The platform supports the complete ordering journey from account creation to restaurant browsing, cart checkout, Paystack payment, kitchen fulfilment, driver dispatch, delivery tracking, chat, ratings, profile management, and admin reporting.

## What The Project Does

QuickBite is split into four user experiences:

- Customers use the mobile app to browse restaurants, filter meals, add items to cart, save delivery addresses, pay for orders, chat with merchants, upload profile photos, and track order progress.
- Merchants use the mobile app and web portal to manage incoming kitchen orders, update menu items, upload food and restaurant images, maintain restaurant profile details, and reply to customer chats.
- Drivers use the mobile app to go online, accept delivery jobs, view active order details, share live location, complete deliveries, review delivery history, and update their profile.
- Admins use the mobile app and web portal to monitor platform stats, approve or suspend restaurants, manage users, review orders, cancel active orders, and inspect performance reports.

## Project Structure

```text
QuickBite/
  mobile/    Expo React Native app for customer, merchant, driver, and admin users.
  web/       Next.js web portal for admin and merchant dashboard workflows.
  server/    Active Node.js API using Express, Prisma, Neon/Postgres, Paystack, and uploads.
  backend/   Older Spring Boot reference backend kept for reference only. Do not deploy this folder.
  images/    Project screenshots and supporting image assets.
  uploads/   Local upload storage used during development when applicable.
```

## Technology Stack

- Mobile: Expo SDK 54, React Native 0.81, React 19, React Navigation, Redux Toolkit, Secure Store, Camera, Image Picker, Location, Async Storage.
- Web: Next.js 16, React 19, TypeScript, Tailwind CSS 4.
- API: Node.js 20+, Express, Prisma, PostgreSQL, JWT authentication, bcrypt password hashing, Multer uploads, Cloudinary image storage, Paystack payments.
- Database: Prisma schema with users, restaurants, menu items, orders, order items, chat messages, roles, statuses, and useful indexes.
- Deployment: Railway for the Node API and Vercel for the Next.js web portal.
- Mobile builds: Expo and EAS for Android and iOS builds.

## Main Features

- Secure login, signup, OTP verification, logout confirmation, forgot password, and reset password.
- Role-based routing for customer, merchant, driver, and admin screens.
- Customer restaurant discovery with categories, menu browsing, item details, cart management, checkout, Paystack payment, receipts, and order status.
- Saved delivery address support so customers do not re-enter delivery details at every checkout.
- Profile updates with name, phone, password, and profile image upload.
- Merchant kitchen queue with status updates from pending to preparing to ready.
- Merchant menu manager with name, price, category, description, image upload, fallback image URL, sample item creation, and delete controls.
- Merchant profile editor with owner name, restaurant name, cuisine type, restaurant image, status, rating, and account email display.
- Customer and merchant chat with text messages, image attachments, unread counts, polling, and message deletion support where implemented in the app flow.
- Driver dashboard with availability status, available orders, active delivery details, location sharing, completion flow, and delivery history.
- Admin dashboard with live stats, restaurant approval and suspension, user verification, order review, cancellation, and reporting.
- Responsive admin and merchant web portal layouts for desktop and mobile browser use.

## End-To-End App Flow

1. A user creates an account or logs in through the mobile app or web portal depending on their role.
2. Customers verify their account, browse active restaurants, choose menu items, and add them to the cart.
3. Customers save a delivery address, apply any valid discount flow such as `FIRST50`, and begin checkout.
4. The app initializes Paystack payment and only creates the order after payment verification succeeds.
5. The order is stored with the selected restaurant, order items, total, payment reference, customer details, and starting status.
6. The restaurant merchant sees the order in the kitchen queue and moves it through preparation states.
7. Drivers can go online, accept available delivery work, share delivery location, and mark delivery complete.
8. Customers follow order status, receive receipt details, and can chat with the restaurant.
9. Admins monitor activity, manage accounts and restaurants, review orders, cancel eligible orders, and inspect reports.
10. Ratings and profile updates feed back into restaurant, driver, and account records.

## Database Model Summary

The active database schema is in `server/prisma/schema.prisma`.

- `User` stores customers, drivers, merchants, and admins with role, verification, phone, profile image, OTP, and password fields.
- `Restaurant` stores merchant restaurant records with approval status, owner, email, image, rating, cuisine type, menu items, orders, and chat messages.
- `MenuItem` stores restaurant menu data including name, description, price, image, and category.
- `Order` stores customer, restaurant, driver, status, payment, ratings, total, and timestamps.
- `OrderItem` stores the individual line items attached to an order.
- `ChatMessage` stores customer-merchant conversation records with text, image URL, sender role, and timestamps.

Important enums:

- `Role`: `CUSTOMER`, `RESTAURANT`, `DRIVER`, `ADMIN`.
- `RestaurantStatus`: `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`.
- `OrderStatus`: `PENDING`, `PREPARING`, `READY`, `DELIVERING`, `DELIVERED`, `CANCELLED`.

## API Overview

The active API is the Node server in `server/`. Route files are grouped by feature:

- `server/src/routes/auth.js`: login, signup, merchant registration, OTP, forgot password, reset password.
- `server/src/routes/customer.js`: customer restaurants, menus, cart/order support, payment-facing order workflows, profile, address, ratings.
- `server/src/routes/merchant.js`: merchant profile, menu manager, kitchen orders, order status, image upload.
- `server/src/routes/driver.js`: driver availability, available orders, active order, delivery status, location, history, profile.
- `server/src/routes/admin.js`: platform stats, restaurants, users, orders, reports, approval, suspension, verification, cancellation.
- `server/src/routes/chat.js`: customer and merchant chat, image attachments, message reads/deletes where supported.

Shared helpers live in `server/src/middleware`, `server/src/services`, `server/src/utils`, `server/src/config.js`, and `server/src/prisma.js`.

## Required Environment Variables

Backend variables for `server`:

```text
DATABASE_URL=
JWT_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PUBLIC_BASE_URL=
CLIENT_ORIGIN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Mobile variable for Expo:

```text
EXPO_PUBLIC_API_URL=https://quickbite-api-production-903f.up.railway.app
```

Web variable for Next.js:

```text
NEXT_PUBLIC_API_URL=https://quickbite-api-production-903f.up.railway.app
```

## Running The Backend Locally

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Use `npm run start:migrate` in deployment environments when migrations should run before the server starts.

Useful backend commands:

```bash
npm run start
npm run prisma:dev
npm run seed
```

## Running The Mobile App Locally

```bash
cd mobile
npm install
npx expo start
```

Useful mobile commands:

```bash
npm run android
npm run ios
npm run web
```

For phone testing, make sure `EXPO_PUBLIC_API_URL` points to a reachable API URL. A physical phone cannot call `localhost` on the development computer unless tunneling or a LAN IP is used.

## Building The Mobile App

Use Expo/EAS for installable Android and iOS builds.

```bash
cd mobile
npx eas build --platform android
```

```bash
cd mobile
npx eas build --platform ios
```

The Expo project is configured with this Android package name:

```text
com.quickbite.app
```

## Running The Web Portal Locally

```bash
cd web
npm install
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000
```

The portal supports both admin and merchant roles. Admin users see dashboard, restaurants, orders, users, and reports. Merchant users see kitchen queue, menu manager, customer chat, and restaurant profile.

## Building The Web Portal

```bash
cd web
npm run lint
npm run build
```

The web portal is configured as a Next.js app. For production, deploy the `web` folder as the Vercel project root.

## Vercel Deployment Guide

Deploy the `web` folder to Vercel after the latest code is pushed to GitHub.

Recommended Vercel settings:

- Framework: Next.js.
- Root directory: `web`.
- Install command: `npm install`.
- Build command: `npm run build`.
- Output directory: Vercel default for Next.js.
- Environment variable: `NEXT_PUBLIC_API_URL=https://quickbite-api-production-903f.up.railway.app`.

After deployment, test the production URL on desktop and on a phone browser.

## Railway Deployment Guide

Deploy the active backend from the `server` folder.

Recommended Railway settings:

- Root directory: `server`.
- Start command: `npm run start:migrate` or the command configured in `server/railway.json`.
- Node version: 20 or newer.
- Database: Neon or another Postgres provider through `DATABASE_URL`.
- Set Paystack, JWT, Cloudinary, CORS, and public base URL variables before testing production flows.

After deployment, test auth, restaurant loading, menu loading, order creation, payment verification, image upload, chat, and admin stats.

## App Icon And Assets

The mobile app icon is configured in `mobile/app.json`.

Important icon files:

- Main app icon: `mobile/assets/icon.png`.
- Android launcher icon: `mobile/assets/icon.png`.
- Android adaptive foreground: `mobile/assets/android-icon-foreground.png`.
- Android adaptive background: `mobile/assets/android-icon-background.png`.
- Android monochrome icon: `mobile/assets/android-icon-monochrome.png`.
- Web favicon: `mobile/assets/favicon.png`.

The main icon is 1024x1024, which is correct for Expo. Android also has an explicit `android.icon` value so installed builds should show the QuickBite icon properly.

If an old icon still appears on a phone, uninstall the old QuickBite app from the phone first, then install a fresh build. Android can cache launcher icons from previous installs.

## Test Credentials And Security

Do not publish demo passwords in this README or in the web/mobile auth screens.

Use only privately shared test credentials from the project owner during QA. If credentials are accidentally committed, rotate them immediately and remove them from the repository history before release.

## Current Live Backend

```text
https://quickbite-api-production-903f.up.railway.app
```

## Team Task Distribution

### Chinaza - Customer App Flow

Chinaza owns the customer shopping and ordering experience from login through checkout and order tracking.

What Chinaza worked on:

- Customer home experience with restaurant browsing, category filtering, and visible guidance text.
- Restaurant menu screens that show menu item details, prices, categories, images, and item detail navigation.
- Cart behavior that keeps selected items grouped and updates quantities, totals, and cart count state.
- Checkout flow that reads saved delivery address, applies valid discount state, starts payment, and moves users to order status after success.
- Customer profile flow for name, phone, password, saved delivery address, and profile photo updates.

How Chinaza should test it:

- Start from a fresh app install and log in as a customer.
- Confirm the customer home screen opens without old session leakage.
- Confirm animated guidance text is readable and does not overlap cards, tabs, or buttons.
- Search restaurants and test category filters.
- Confirm the burger category uses food-appropriate artwork or icon treatment.
- Open a restaurant and verify menu item cards, item details, images, prices, and descriptions.
- Add multiple items to cart and confirm they remain grouped correctly.
- Confirm the cart count badge does not block the cart icon or label.
- Apply `FIRST50` and verify it appears at checkout and receipt only when valid.
- Save a delivery address from profile and confirm checkout reuses it.
- Update profile name, phone, password, and photo.
- Report any customer text, badge, button, card, or image that overlaps on small phones.

### Ali - Authentication And Account Safety

Ali owns account access, role routing, logout behavior, and safety checks around authentication.

What Ali worked on:

- Login and registration flows for customer, driver, and merchant roles.
- OTP verification and account verification checks.
- Forgot password and reset password flows connected to backend auth routes.
- Session handling so old local sessions do not silently bypass auth after a fresh app open.
- Logout confirmation so users do not accidentally end a session.
- Removal of public demo account shortcuts and shared passwords from the UI.

How Ali should test it:

- Fresh install the app and confirm it starts at the auth flow.
- Confirm users are not logged in automatically from stale local storage.
- Verify the auth page does not show demo account buttons or shared test passwords.
- Test login with empty fields, invalid email format, and wrong credentials.
- Confirm clear error messages are shown for invalid login attempts.
- Test customer, driver, and merchant signup paths.
- Test OTP verification for newly created accounts.
- Test forgot password request and reset password using the configured backend email/log flow.
- Confirm the reset password flow rejects invalid or expired codes.
- Confirm logout asks `Are you sure you want to logout?` before ending the session.

### Mrs Vicky - Checkout, Payment, And Receipt

Mrs Vicky owns the payment journey, order confirmation, cart totals, and customer receipt details.

What Mrs Vicky worked on:

- Cart totals and quantity changes before checkout.
- Checkout validation so payment cannot continue without required delivery information.
- Paystack initialization and verification flow.
- Order creation after successful payment verification.
- Receipt details including order number, restaurant, items, discount, total paid, and payment reference.
- Production-safe wording around payment instead of demo-card language.

How Mrs Vicky should test it:

- Add multiple items to cart from one restaurant.
- Increase and reduce item quantities and confirm subtotal and total values update.
- Open checkout and confirm selected restaurant, items, and delivery address are correct.
- Confirm checkout blocks payment when no delivery address is saved.
- Start Paystack checkout and verify it opens correctly.
- Complete payment and confirm the API verifies the reference before creating the order.
- Confirm the cart clears only after verified payment succeeds.
- Confirm the order status screen opens after payment.
- Confirm the receipt shows order number, restaurant, item list, discount, total paid, and payment reference.
- Confirm `FIRST50` appears on checkout and receipt when it applies.
- Confirm failed or cancelled payments do not create completed orders.

### Kelly - Chat And Messaging

Kelly owns customer and merchant messaging across mobile and merchant web surfaces.

What Kelly worked on:

- Customer-to-merchant text messaging.
- Merchant-to-customer replies.
- Image attachments in both customer and merchant chat flows.
- Unread message count behavior in the customer Chat tab.
- Message thread refresh and polling behavior.
- Long-press message delete prompts in supported mobile chat screens.

How Kelly should test it:

- Send a message from customer to merchant.
- Send a reply from merchant to customer.
- Attach an image in customer chat and confirm it sends and displays.
- Attach an image in merchant chat and confirm it sends and displays.
- Confirm the customer Chat tab shows a red unread count for new merchant messages.
- Confirm unread count increases from 1 to 2 as new messages arrive.
- Open the chat and confirm unread count clears after messages are seen.
- Long-press a customer chat message and confirm the delete prompt appears.
- Long-press a merchant chat message and confirm the delete prompt appears.
- Delete a message and confirm it disappears from the thread.
- Confirm the chat image preview, text input, attach button, and send button have safe bottom spacing on small phones.
- Test the merchant web chat on a phone browser and confirm long customer emails truncate instead of widening the page.

### Ayo - Driver App Flow

Ayo owns driver availability, delivery assignment, location, active order handling, and delivery history.

What Ayo worked on:

- Driver dashboard for online/offline status.
- Available order list for drivers who are ready to accept deliveries.
- Active delivery screen with restaurant, customer, item, payout, and status details.
- Location permission and live location update behavior.
- Delivery completion and history view.
- Driver profile update flow with name, phone, password, and photo.

How Ayo should test it:

- Log in as a driver and confirm the driver dashboard opens.
- Confirm animated driver guidance text is readable and not overlapping controls.
- Toggle online and offline status.
- Confirm available orders load on the driver board.
- Accept an available order and confirm it becomes the active order.
- Confirm active order details show restaurant, customer, items, payout, and status.
- Test location permission prompt on a real device.
- Confirm live location status updates while delivering.
- Complete an order and confirm it moves to delivery history.
- Test driver profile name, phone, password, and photo update.
- Confirm driver logout asks for confirmation.

### Esther - Merchant App Flow

Esther owns the merchant mobile dashboard and merchant operating workflow.

What Esther worked on:

- Merchant dashboard entry after merchant login.
- Kitchen queue loading and order status updates.
- Menu item creation with name, price, category, description, and image.
- Menu item editing and deletion checks.
- Restaurant profile updates for public merchant details.
- Merchant image upload for restaurant and menu records.
- Merchant customer chat replies and message deletion support.

How Esther should test it:

- Log in as a merchant and confirm the merchant dashboard opens.
- Confirm animated merchant guidance text is readable.
- Test kitchen queue order loading.
- Accept a pending order and move it to preparing.
- Mark an order as ready for pickup.
- Add a menu item with name, price, category, description, and image.
- Edit an existing menu item and confirm the update persists.
- Delete a menu item only after confirming the selected item is correct.
- Update restaurant name, owner name, cuisine type, and restaurant image.
- Reply to a customer chat.
- Delete a chat message by long-pressing it where supported.
- Confirm merchant logout asks for confirmation.
- Test merchant web kitchen, menu, chat, and profile pages on a phone browser.

### Isaac - Admin Web And Mobile Admin

Isaac owns admin testing, web portal readiness, mobile admin checks, and Vercel deployment.

What Isaac worked on:

- Admin web portal testing from the `web` folder.
- Admin login and role-based navigation.
- Merchant web login and role-based merchant tabs.
- Admin dashboard, restaurants, orders, users, and reports workflows.
- Web responsive behavior for admin and merchant pages on mobile phones.
- Mobile admin login and logout confirmation.
- Vercel deployment setup for the Next.js portal.

How Isaac should test it:

- Run the admin web app locally from the `web` folder.
- Confirm admin login works with a real admin account.
- Confirm merchant login works on the web portal.
- Test dashboard, restaurants, orders, users, reports, kitchen, menu, chat, and profile pages where each role allows access.
- Resize the browser to phone width and confirm header controls wrap safely.
- Confirm admin tables scroll inside their panels instead of forcing the whole page wider than the phone.
- Confirm merchant kitchen actions, menu cards, chat threads, and profile cards fit on mobile.
- Confirm mobile admin login opens the admin dashboard.
- Confirm mobile admin logout asks for confirmation.
- Run `npm run lint` and `npm run build` before deployment.
- Create or connect the Vercel project using the `web` folder as the root directory.
- Set `NEXT_PUBLIC_API_URL` in Vercel.
- Deploy to Vercel and test the production URL on desktop and phone browser.

### Collins - Backend, Database, And Release Checks

Collins owns backend reliability, database correctness, integrations, and final release checks.

What Collins worked on:

- Active Node.js backend in `server`.
- Prisma schema, migrations, and seed support.
- JWT auth middleware and role-protected routes.
- Paystack payment initialization and verification services.
- Cloudinary/upload support for profile, restaurant, menu, and chat images.
- Admin, customer, merchant, driver, and chat route reliability.
- Release checks before GitHub push and deployment.

How Collins should test it:

- Confirm the active backend is the Node server in `server`, not the old Spring Boot reference backend.
- Confirm backend routes start correctly with Node 20+.
- Confirm Prisma migrations are applied to the correct Postgres database.
- Confirm forgot password and reset password endpoints work.
- Confirm chat delete API protects messages by customer or merchant ownership.
- Confirm Paystack initialize and verify payment routes work.
- Confirm order creation stores correct items, totals, status, customer details, restaurant ID, and payment reference.
- Confirm profile image upload returns a valid image URL.
- Confirm address persistence works in the mobile app.
- Confirm no public file exposes shared test passwords.
- Run final syntax, lint, and build checks before release.
- Coordinate the final commit and push to GitHub.

## QA Checklist

Before a release, test these areas:

- Mobile app opens from a fresh install and starts with authentication.
- Customer browsing, cart, checkout, payment, receipt, and order status work.
- Merchant kitchen queue, menu manager, profile, and chat work on mobile and web.
- Driver online status, order acceptance, location, completion, and history work.
- Admin users, restaurants, orders, reports, approvals, suspensions, and cancellations work.
- Web portal is usable at desktop width and phone width.
- No important text overlaps buttons, icons, images, cards, or headers.
- Upload flows return usable image URLs.
- Paystack payment verification is required before order creation.
- Production environment variables are set correctly.
- No demo credentials or private secrets are published.

## Final Release Checklist

Before pushing and deploying:

- `server` installs and starts successfully.
- Prisma client generation and migrations complete successfully.
- `mobile` runs in Expo.
- `web` lint passes.
- `web` production build passes in the deployment environment.
- App icon shows on a fresh Android install.
- Auth page has no demo access buttons.
- Checkout and receipts work after verified payment.
- Chat unread count and message deletion work.
- Vercel environment variables are set.
- Railway environment variables are set.
- Production web URL is tested on desktop and phone browser.
