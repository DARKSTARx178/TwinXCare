# TwinXCare

TwinXCare is a cross-platform (React Native + Expo + web) application originally built for **Yong-En Care Centre** to manage medical equipment rental and volunteer escort services. It includes user roles, matching logic, admin controls, push notifications, and accessibility-first UI.

## 🚀 Feature Summary

See `FEATURES.txt` for the full plain-text page summary. The app currently includes:

- **Home page:** Main dashboard with shortcuts to equipment rental, escort services, assistance, bookings, feedback, login, and registration.
- **Explore / Equipment page:** Browse equipment and care services, search listings, apply filters, sort by price, and open item details.
- **Equipment detail / Order page:** Review equipment details, choose pickup warehouse, quantity, rental dates, and continue by swipe-to-rent.
- **Payment page:** Confirm equipment rentals or service bookings, show totals, collect delivery address when needed, save the transaction, and send notifications.
- **Delivery page:** Track active equipment orders and service bookings in a searchable and filterable timeline.
- **Services / Escort dashboard page:** View patient escort requests and volunteer availability slots with status tracking.
- **Request Escort page:** Submit appointment, hospital, pickup, contact, medical, and certification details for escort help.
- **Volunteer Availability page:** Let escort volunteers post available dates, times, location, travel radius, and contact details.
- **Escort Assignment page:** Show matched job details and handle confirmation, completion, and rating.
- **Certifications page:** Let volunteers submit certification links and view review status.
- **Profile, Login, Register, and Password pages:** Handle user accounts, roles, authentication, and password updates.
- **Settings page:** Manage language, accessibility presets, typography controls, theme colors, and app version display.
- **Assistance, Feedback, and Help pages:** Submit support requests, send rated feedback, and read basic help guidance.
- **Admin pages:** Manage equipment, warehouses, services, schedules, deliveries, users, escort matching, certifications, and support inbox items.
- **System features:** Automatic escort matching, Firebase Auth/Firestore storage, push/local notifications, remote version checks, and static web preview pages.

## 🗂️ Project Structure

- `app/` — Expo Router pages and screens
  - `(tabs)/` — main tabbed app: `delivery`, `explore`, `services`, `settings`
  - `admin/` — admin pages
  - `escorts/` — escort request and slot flow
  - `notifs/` — notification setup
- `components/` — reusable UI components
- `contexts/` — theme, language, and accessibility providers
- `firebase/` — Firebase setup (`auth`, `firestore`)
- `services/` — matching and rating services
- `utils/` — app helpers (version, notifications, translations)
- `api/` — cloud functions and support APIs (send-email, delete-account)

## 🛠️ Tech Stack

- Expo SDK (`~54`), React Native `0.81`
- Firebase: Firestore + Auth + Cloud Functions (admin / user flows)
- `react-navigation` + `expo-router`
- `expo-notifications`, `expo-localization`, `react-native-maps`, `react-native-picker-select`
- `typescript`, `eslint`, `babel`

## ⚙️ Setup

### 1. Clone

```bash
git clone https://github.com/DARKSTARx178/TwinXCare.git
cd TwinXCare
```

### 2. Install

```bash
npm install
```

### 3. Firebase

The app has a built-in `firebase/firebase.js` config pointing to:
- project: `twinxcarebackend`
- Firestore + auth ready

For your own deployment, replace with your Firebase credentials and ensure these collections exist:
- `users`
- `escort/request/entries`
- `escort/availability/entries`
- `version/verProd`

### 4. Run

- Mobile/dev with Expo CLI:
  - `npm run start`
  - `npm run android`
  - `npm run ios`
- Web:
  - `npm run web`

### 5. Lint

```bash
npm run lint
```

## 🔐 Authentication and Roles

Users are tagged with `role` and `userType` in Firestore:
- `role: admin`
- `userType: escort` (volunteer)
- `userType: standard` (patient)

Requests and availabilities are created under Firestore entries and matched by `services/matchingService.ts`.

## 🧠 Matching Workflow

- New request (patient) triggers match check.
- New availability (escort) triggers match check.
- Match condition:
  - same date,
  - request window fits inside availability window,
  - hospital/location fuzzy match,
  - first eligible entry is assigned.
- Status updates and notifications are written into Firestore and pushed via tokens.
- Lock-in by both parties updates status to `confirmed`.

## 🛡️ Remote Version Gate

`app/_layout.tsx` reads `version/verProd` from Firestore, compares to local `APP_VERSION`, and blocks app usage until update if mismatch.

## 🧩 Testing / Reset

- Restore local stored project state: `npm run reset-project`

## 🫶 Developer Notes

- `app/(tabs)/services.tsx` includes admin button to manually run matcher (`triggerManualMatching`).
- `utils/notifications.ts` defines local + push payload shape.
- `services/ratingService.ts` handles rating writes and adjusts averages.

## 📬 Support

- MASSIVE Productions
- Email: massive.productions.co@gmail.com

---

> This README is now updated to match the project code, routing, and services as of March 2026.
