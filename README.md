# TwinXCare

TwinXCare is a cross-platform (React Native + Expo + web) application originally built for **Yong-En Care Centre** to manage medical equipment rental and volunteer escort services. It includes user roles, matching logic, admin controls, push notifications, and accessibility-first UI.

## 🚀 Feature Summary

See `FEATURES.txt` for the full plain-text feature inventory. The app currently includes:

- Cross-platform Expo app shell with mobile and web routing.
- Firebase authentication for registration, login, logout, profile, role handling, and password changes.
- Role-based workflows for seniors/patients, escort volunteers, and admins.
- Equipment rental catalog with search, stock filters, price sorting, warehouse stock, pickup selection, rental dates, payment confirmation, stock deduction, and order history.
- Care service booking catalog with schedule dates, time slots, capacity tracking, contact details, payment confirmation, and booking history.
- Delivery/history tracking that combines equipment orders and service bookings with search, filters, latest active item highlight, timeline details, ETA display, and pull-to-refresh.
- Escort request and volunteer availability workflows with patient details, pickup coordinates, volunteer radius, certification requirements, and recent slot tracking.
- Automated escort matching by date, time overlap, location text or coordinate radius, certification fit, volunteer rating, and candidate score.
- Escort match lifecycle covering pending, matched, confirmed, and completed states, with two-party confirmation and two-party completion.
- Volunteer rating updates after completed escort jobs.
- Escort certification submission for volunteers and admin review of pending, approved, or revoked certificates.
- Push and local notifications for orders, bookings, escort matches, confirmations, completions, compromise requests, and notification tap routing.
- Assistance request and feedback forms that save to Firestore.
- Help center with basic app guidance and common questions.
- Accessibility and personalization settings for language, theme presets, typography, advanced color tokens, and default restoration.
- Remote version enforcement that blocks outdated builds until users update.
- Admin control center for equipment, warehouses, services, schedules, deliveries, users, escort matching, certifications, and support inbox.
- Public static web pages and app preview pages under `public/`.

## Feature Inventory

### Core App

- **Cross-platform app shell:** Runs as an Expo React Native app with mobile and web route support.
- **Splash and startup flow:** Shows a branded splash screen while checking setup and app version state.
- **Remote version gate:** Compares the installed app version with Firestore production version data and blocks outdated builds with an update prompt.
- **Session expiry handling:** Checks signed-in users for session expiry and clears expired sessions.
- **Push notification setup:** Requests notification permission, stores Expo push tokens on the user profile, and routes notification taps when a target screen is included.
- **Theme system:** Provides app-wide color themes through a shared theme context.
- **Accessibility presets:** Offers Standard, High Contrast, and Eye Comfort color presets.
- **Language support:** Supports English and Simplified Chinese strings across translated screens.
- **Responsive typography support:** Uses configurable font-size helpers across many screens.
- **Tab navigation:** Provides Home, Explore, Services, Delivery, and Settings as the main app areas.

### Home and Navigation

- **Home dashboard:** Presents quick access to equipment rental, escort services, assistance, bookings, feedback, login, and registration.
- **Order history widget:** Shows recent user activity from saved rental and booking history.
- **Guest-aware actions:** Shows login and registration prompts when no Firebase user is signed in.
- **Authenticated feedback access:** Shows feedback submission access after login.

### Authentication and Account

- **User registration:** Creates Firebase Auth users and Firestore profiles with username, email, role, user type, history, bookings, and default theme.
- **User type selection:** Lets new users register as Senior/standard users or Escort volunteers.
- **Login:** Signs users in with Firebase email/password and records a session start timestamp.
- **Logout:** Signs users out and clears local session state.
- **Profile page:** Displays user identity, role badge, user reference, and account menu actions.
- **Guest profile mode:** Lets unauthenticated users sign in or register from the profile screen.
- **Admin entry point:** Shows an admin dashboard button for users with the admin role.
- **Change password:** Reauthenticates the current user and updates their Firebase Auth password.
- **Account security management screen:** Provides a legacy/admin-oriented password reset and deletion UI against a configured local server endpoint.

### Equipment Rental

- **Equipment catalog:** Loads equipment from Firestore and displays product cards with image, brand, price, and stock.
- **Equipment search and filters:** Filters equipment by search term, stock state, and price order.
- **Location-aware stock display:** Requests location permission and shows stock for the nearest warehouse when available.
- **Equipment detail page:** Shows item image, price, brand, description, stock state, pickup points, quantity controls, and rental dates.
- **Pickup point selection:** Lets users choose a warehouse/pickup point with available stock.
- **Pickup map support:** Shows pickup locations on native maps where supported.
- **Swipe-to-rent action:** Uses a swipe interaction to proceed from equipment detail to payment.
- **Payment summary:** Displays quantity, duration, pickup warehouse, and total amount before confirmation.
- **Delivery address autocomplete:** Captures delivery location and coordinates for equipment orders.
- **Stock deduction transaction:** Deducts stock from the selected warehouse inside a Firestore transaction.
- **Rental order history:** Saves equipment orders into the user's Firestore history array with transaction ID and status.

### Service Booking

- **Service catalog:** Loads care services from Firestore with image, company, price, duration, and description.
- **Service search and filters:** Filters services by search term, schedule presence, and price ordering.
- **Service booking detail page:** Lets users select a schedule date, time slot, phone number, and optional notes.
- **Slot capacity deduction:** Reduces the selected service slot's pax count after booking.
- **User booking history:** Saves service bookings into the user's Firestore booking array.
- **My Bookings page:** Lists active and upcoming service bookings with date, time, description, and confirmed status.

### Delivery and History

- **Delivery status page:** Combines equipment orders and service bookings into one timeline.
- **Latest active item highlight:** Shows the latest active order or booking in a summary card.
- **Delivery search and filters:** Searches by reference/details and filters by type or status.
- **Completed item hiding:** Hides completed or delivered entries from the active delivery view.
- **Expandable timeline cards:** Expands each history item to show reference, total, address or slot details, warehouse, and final status.
- **Pull-to-refresh history:** Refreshes current user history and bookings from Firestore.

### Escort Requests and Volunteering

- **Escort dashboard:** Shows patient requests and volunteer availability slots based on user type and role.
- **Patient escort request form:** Captures appointment schedule, hospital, pickup location, patient details, contacts, medical notes, certification need, and instructions.
- **Escort availability form:** Lets volunteers provide date, availability window, location, service radius, and contact phone.
- **Automatic escort matching:** Matches pending requests and available volunteers by date, time overlap, location/radius, certification fit, and score.
- **Match notifications:** Notifies both patient and volunteer when a match is created.
- **Matched assignment details:** Shows linked patient or volunteer information, schedule, notes, medical details, ratings, and approved certifications.
- **Dual confirmation lock-in:** Both patient and volunteer must slide to confirm before a match becomes confirmed.
- **Job completion workflow:** Both sides must slide to end a confirmed escort job before it becomes completed.
- **Patient rating of volunteer:** Requires patient rating before ending a confirmed escort job and updates the volunteer's profile average.

### Escort Certifications

- **Volunteer certification submission:** Lets escorts submit a certification type, certificate URL, and optional notes for admin review.
- **Certification submission history:** Shows submitted certifications with pending, approved, or revoked status and review metadata.
- **Approved certification matching:** Automatic matching only accepts volunteers with the required approved certification when one is required.

### Support, Feedback, and Help

- **Assistance request form:** Lets users submit support or help requests into Firestore with username and timestamp.
- **Feedback form:** Collects a 1-5 star rating plus comments and saves the feedback to Firestore.
- **Help center:** Provides in-app guidance for getting started, navigation, password changes, support contact, and escort mode.

### Settings

- **Language setting:** Switches between English and Simplified Chinese.
- **Accessibility theme presets:** Applies Standard, High Contrast, or Eye Comfort themes.
- **Typography selector:** Provides small, medium, and large typography controls in the settings UI.
- **Advanced theme configuration:** Lets users change individual theme color tokens with color swatches.
- **Restore default theme:** Resets custom theme colors to default values.
- **App version display:** Shows the production version read from Firestore.

### Admin

- **Admin control center:** Provides admin navigation for equipment, services, deliveries, users, escort matching, certifications, and support inbox.
- **Equipment management:** Creates, updates, searches, expands, and deletes equipment records.
- **Warehouse management:** Adds, edits, and deletes pickup warehouses using location autocomplete.
- **Location-based stock management:** Tracks equipment stock per warehouse and keeps total stock synchronized.
- **Service management:** Creates and deletes care services with name, description, price, duration, company, image URL, and schedules.
- **Service schedule management:** Adds and deletes date/time/pax slots for each service.
- **Delivery management:** Lists all users' equipment orders, searches by transaction ID, updates delivery ETA, and toggles completion status.
- **User management:** Lists registered users, changes roles between user/admin, and deletes non-admin users through a backend endpoint.
- **Manual matching dashboard:** Lets admins select pending escort requests and available volunteers.
- **Manual force match:** Lets admins override the matching engine and lock a request/availability pair.
- **Compromise request notification:** Lets admins ask a volunteer by push notification whether they can help with a selected patient request.
- **Certification catalog management:** Lets admins create, enable/disable, and delete escort certification types.
- **Certification review:** Lets admins approve or revoke volunteer certification submissions.
- **Admin support inbox:** Displays feedback and assistance requests with search, type/status filters, archive/unarchive, auto-archive after 30 days, and delete.

### API and Static Web

- **Serverless API endpoints:** Includes Firebase config, logs, app version, SendGrid email, self-delete, and admin-delete-user endpoints.
- **Push script:** Includes a script for sending Expo push notifications.
- **Public marketing site:** Includes static web pages for the main site, contact, services, and escort form.
- **Static app previews:** Includes browser-accessible app screen mockups under `public/app`.

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
