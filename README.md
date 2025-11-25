node -v
npm -vnode -v
npm -vnode -v
npm -v# Alumni Management — Prototype (Next.js + Tailwind + Firebase)

This workspace contains a minimal starter scaffold for the SIH backup idea prototype built with Next.js, Tailwind CSS and Firebase.

Quick setup (Windows PowerShell)

```powershell
# 1) Create the project dependencies
cd "c:\Users\vijay\OneDrive\Desktop\SIH protptype"
npm install


# 2) Add your Firebase config
# Edit `lib/firebase.ts` and paste the config object from your Firebase console

# 3) Start dev server
npm run dev

# Open http://localhost:3000
```

Notes
- Place your Firebase config in `lib/firebase.ts` as shown in the file header comment.
- The signup page (`/signup`) includes role selection and attempts to create a Firebase Authentication user. It requires a valid Firebase config.
- Next steps for the team: wire Firestore schema, security rules, storage bucket, cloud functions and implement document upload and admin verification UI.
