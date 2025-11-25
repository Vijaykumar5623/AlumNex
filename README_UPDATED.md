# Alumni Management — Prototype (Next.js + Tailwind + Firebase)

This workspace contains a working prototype for the SIH backup idea built with Next.js, Tailwind CSS and Firebase.

## Quick Start (Windows PowerShell)

```powershell
cd "c:\Users\vijay\OneDrive\Desktop\SIH protptype"
npm install
npm run dev
# Open http://localhost:3000
```

## Firebase Setup

Before the app fully works, you need to configure Firebase:

1. **Set your Firebase config** — Already in `.env.local` ✓
2. **Enable Firestore, Storage, and Auth** — See `FIREBASE_SETUP.md` for detailed instructions
3. **Apply Security Rules** — Copy rules from `firestore-rules.txt` to your Firebase console
4. **Test** — Sign up and verify

See `FIREBASE_SETUP.md` for step-by-step Firebase configuration.

## Features Implemented

### Phase 0 — Kickoff & Setup ✓
- Project scaffold with Next.js + Tailwind + Firebase
- Environment variables configured
- Basic pages structure

### Phase 1 — Auth & Data Foundation ✓
- **Email/password signup & login** with role selection (Student/Alumni/Admin)
- **Firestore profiles** collection — users saved with role and verification status
- **Auth context** (`lib/authContext.tsx`) — global auth state management across app
- **Dashboard** (`pages/dashboard.tsx`) — personalized home for each role
- **Admin pending-verifications** (`pages/admin/pending-verifications.tsx`) — admins can approve/reject alumni

### Pages Available

- `/` — Landing page with signup/admin links
- `/signup` — Role-based signup (creates Firestore profile + Firebase Auth user)
- `/login` — Sign in with email/password
- `/dashboard` — Main dashboard for authenticated users (role-specific actions)
- `/admin/pending-verifications` — Admin panel to approve/reject new alumni
- (More pages coming in Phase 2–4)

## Development

### Running locally
```powershell
npm run dev
```
App runs on `http://localhost:3000`. Hot-reloads on file changes.

### Building for production
```powershell
npm run build
npm run start
```

## Project Structure

```
pages/
  _app.tsx              — App wrapper with AuthProvider
  index.tsx             — Landing page
  signup.tsx            — Signup form
  login.tsx             — Login form
  dashboard.tsx         — Main dashboard (role-specific)
  admin/
    pending-verifications.tsx  — Admin approval panel

lib/
  firebase.ts           — Firebase initialization (reads from .env.local)
  authContext.tsx       — Auth context for global user state

styles/
  globals.css           — Global Tailwind styles
```

## Next Phases

- **Phase 2** — Document upload & alumni verification flow, Jobs/Events posting, Mentorship matching
- **Phase 3** — Real-time chat, Admin dashboard & analytics
- **Phase 4** — Polish, accessibility, testing, deployment to Vercel

## Useful Links

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Firestore Rules](./firestore-rules.txt)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Docs](https://firebase.google.com/docs)
