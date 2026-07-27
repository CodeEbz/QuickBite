# QuickBite

QuickBite is a food delivery platform for customers, merchants, drivers, and admins.

Customers use the mobile app to browse restaurants, add meals to cart, pay for orders, chat with merchants, save delivery addresses, manage profiles, and track deliveries.

Merchants use the mobile app and web portal to manage kitchen orders, update menus, reply to customer chats, upload food images, and maintain restaurant profiles.

Drivers use the mobile app to go online, accept delivery jobs, share live location, view delivery history, and update their profiles.

Admins use the mobile app and web portal to monitor the platform, manage users, approve or suspend restaurants, review orders, and track platform performance.

## Project Structure

- `mobile` - Expo React Native mobile app for customers, merchants, drivers, and admins.
- `web` - Next.js admin and merchant web portal.
- `server` - Active Node.js, Express, Prisma, Paystack, and upload API.
- `backend` - Old Spring Boot reference backend. Do not deploy this one.

## Main App Features

- Secure login, signup, OTP verification, logout confirmation, and password reset.
- Customer restaurant browsing, category filtering, cart, checkout, Paystack payment, receipts, and order tracking.
- Saved customer delivery address and editable user profile with profile photo upload.
- Merchant kitchen queue, order status updates, menu management, restaurant profile, image uploads, and customer chat.
- Driver order board, active delivery details, live location sharing, delivery history, profile update, and photo upload.
- Admin dashboard for users, restaurants, orders, verification, suspension, cancellation, and platform reporting.
- Customer and merchant chat with image attachments, unread message count, and message deletion.
- Mobile app icon and Android launcher icon configured through Expo.

## Team Task Distribution

### Chinaza - Customer App Flow

Chinaza owns the customer shopping and ordering experience.

Detailed tasks:

- Test customer login and confirm the customer home screen opens correctly.
- Confirm the animated customer guidance text is readable and not covering other UI.
- Test restaurant search and category filtering.
- Confirm the burger category uses a food/burger icon, not a pizza icon.
- Open a restaurant and confirm menu items display correctly.
- Add items to cart and confirm all selected items stay grouped in the cart.
- Confirm the cart count badge does not block the cart icon or the word `Cart`.
- Test `FIRST50` on the customer home screen and confirm it appears at checkout when valid.
- Save a delivery address from profile and confirm it appears again in checkout.
- Test profile name, phone number, password, and profile photo update.
- Report any customer text, badge, button, or card that overlaps on small phones.

### Ali - Authentication And Account Safety

Ali owns account access, safety, and authentication screens.

Detailed tasks:

- Confirm the app always starts with the Auth process after a fresh open.
- Confirm users are not logged in automatically from old saved sessions.
- Confirm the Auth page does not show demo account buttons.
- Test login with empty email and password fields.
- Test login with invalid email format.
- Test login with wrong credentials and confirm a clear error message appears.
- Test signup with missing fields and weak password.
- Test customer, driver, and merchant signup paths.
- Test forgot password request.
- Test reset password using the reset code from backend logs or the configured email flow.
- Confirm logout asks `Are you sure you want to logout?` before ending the session.
- Confirm public files do not expose shared test passwords.

### Mrs Vicky - Checkout, Payment, And Receipt

Mrs Vicky owns payment, order confirmation, and receipts.

Detailed tasks:

- Add multiple items to cart from one restaurant.
- Confirm cart totals update when item quantity changes.
- Confirm checkout opens with the selected restaurant and selected cart items.
- Confirm checkout blocks payment if no delivery address is saved.
- Confirm Paystack checkout opens correctly.
- Confirm payment verification creates the order only after payment succeeds.
- Confirm the cart clears after verified payment.
- Confirm the order status screen opens after payment.
- Confirm the receipt shows order number, restaurant, items, discount, total paid, and payment reference.
- Confirm `FIRST50` discount appears on the receipt when it applies.
- Confirm payment wording is production-safe and does not describe the card as a demo card.

### Kelly - Chat And Messaging

Kelly owns customer and merchant chat.

Detailed tasks:

- Send a message from customer to merchant.
- Send a reply from merchant to customer.
- Attach an image in customer chat and confirm it sends.
- Attach an image in merchant chat and confirm it sends.
- Confirm the customer Chat tab shows a red unread count for new merchant messages.
- Confirm the unread count changes from 1 to 2 as new messages arrive.
- Open the chat and confirm the unread count clears after messages are seen.
- Long-press a customer chat message and confirm the delete prompt appears.
- Long-press a merchant chat message and confirm the delete prompt appears.
- Delete a message and confirm it disappears from the thread.
- Confirm the chat picture, text input, and send button sit near the bottom with safe spacing.

### Ayo - Driver App Flow

Ayo owns the driver delivery workflow.

Detailed tasks:

- Login as a driver and confirm the driver dashboard opens.
- Confirm the animated driver guidance text is clear.
- Test online and offline status.
- Confirm available orders load on the driver board.
- Accept an available order.
- Confirm active order details show restaurant, customer, items, payout, and status.
- Test location permission prompt.
- Confirm live location status updates while delivering.
- Complete an order and confirm it moves to delivery history.
- Test driver profile name, phone, password, and profile photo update.
- Confirm driver logout asks for confirmation.

### Esther - Merchant App Flow

Esther owns the merchant mobile dashboard.

Detailed tasks:

- Login as a merchant and confirm the merchant dashboard opens.
- Confirm the animated merchant guidance text is clear.
- Test kitchen queue order loading.
- Accept a pending order and move it to preparing.
- Mark an order as ready for pickup.
- Add a menu item with name, price, category, description, and image.
- Edit an existing menu item.
- Delete a menu item only after checking the selected item.
- Update restaurant profile details.
- Upload or change restaurant image.
- Reply to a customer chat.
- Delete a chat message by long-pressing it.
- Confirm merchant logout asks for confirmation.

### Isaac - Admin Web And Mobile Admin

Isaac owns admin testing and Vercel deployment.

Detailed tasks:

- Run the admin web app locally from the `web` folder.
- Confirm admin login works with a real admin account.
- Confirm merchant login works on the web portal.
- Test dashboard, restaurants, orders, users, reports, kitchen, menu, chat, and profile pages where the role allows access.
- Confirm mobile admin login opens the admin dashboard.
- Confirm mobile admin logout asks for confirmation.
- Run the web production build before deployment.
- Create or connect the Vercel project using the `web` folder as the root directory.
- Set `NEXT_PUBLIC_API_URL` in Vercel.
- Deploy to Vercel and test the production URL on desktop and phone browser.

### Collins - Backend, Database, And Release Checks

Collins owns backend reliability and final release checks.

Detailed tasks:

- Confirm the active backend is the Node server in `server`.
- Confirm backend routes start correctly.
- Confirm Prisma migrations are applied to the correct database.
- Confirm forgot password and reset password endpoints work.
- Confirm chat delete API protects messages by customer or merchant ownership.
- Confirm Paystack initialize and verify payment routes work.
- Confirm order creation stores the correct items and totals.
- Confirm profile image upload returns a valid image URL.
- Confirm address persistence works in the mobile app.
- Confirm no public file exposes shared test passwords.
- Run final syntax and build checks before release.
- Coordinate the final commit and push to GitHub.

## App Icon

The mobile app icon is configured in `mobile/app.json`.

Important icon files:

- Main app icon: `mobile/assets/icon.png`
- Android launcher icon: `mobile/assets/icon.png`
- Android adaptive foreground: `mobile/assets/android-icon-foreground.png`
- Android adaptive background: `mobile/assets/android-icon-background.png`
- Android monochrome icon: `mobile/assets/android-icon-monochrome.png`
- Web favicon: `mobile/assets/favicon.png`

The main icon file is 1024x1024, which is correct for Expo. Android also has an explicit `android.icon` value so the installed app should show the QuickBite icon properly.

If an old icon still appears on a phone, uninstall the old app first, then install a fresh build. Android can cache launcher icons from previous installs.

## Running The Mobile App Locally

```bash
cd mobile
npm install
npx expo start
```

Set this environment variable before testing on a phone:

```text
EXPO_PUBLIC_API_URL=https://quickbite-api-production-903f.up.railway.app
```

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

## Running The Backend

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Required backend environment variables:

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

## Running The Web Admin Portal Locally

```bash
cd web
npm install
npm run dev
```

Set this environment variable:

```text
NEXT_PUBLIC_API_URL=https://quickbite-api-production-903f.up.railway.app
```

## Building The Web Admin Portal

```bash
cd web
npm run build
```

## Vercel Deployment Guide

Deploy the `web` folder to Vercel after the final code is pushed to GitHub.

Use these settings on Vercel:

- Framework: Next.js
- Root directory: `web`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: Vercel default for Next.js
- Environment variable: `NEXT_PUBLIC_API_URL=https://quickbite-api-production-903f.up.railway.app`

After deployment, test:

- Admin login.
- Merchant login.
- Dashboard page loading.
- Orders page loading.
- Chat page loading.
- Mobile browser layout.

## Test Credentials

Do not publish demo passwords in the README or Auth page.

Use only privately shared test credentials from the project owner during QA.

## Current Live Backend

```text
https://quickbite-api-production-903f.up.railway.app
```

## Final Release Checklist

Before pushing and deploying:

- Mobile app can run in Expo.
- Backend route syntax checks pass.
- Web production build passes.
- App icon shows on a fresh Android install.
- Auth page has no demo access buttons.
- Checkout and receipts work after payment.
- Chat unread count and message deletion work.
- Vercel environment variables are set.
