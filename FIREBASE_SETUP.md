# Firebase Setup Guide

This document explains how to set up your Firebase project for the Alumni Management prototype.

## 1. Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project `alumni-proto`
3. In the left sidebar, click **Firestore Database**
4. Click **Create Database**
5. Choose **Start in production mode** (we'll add rules next)
6. Select your region (e.g., `us-central1` or closest to your location)
7. Click **Create**

## 2. Enable Storage

1. In the left sidebar, click **Storage**
2. Click **Get Started**
3. Accept the default rules (we'll update them)
4. Choose your region (same as Firestore is recommended)
5. Click **Done**

## 3. Apply Firestore Security Rules

1. In the left sidebar, click **Firestore Database**
2. Click the **Rules** tab at the top
3. Clear the existing text and paste the contents of `firestore-rules.txt` (in this repo)
4. Click **Publish**

These rules restrict access based on user roles (student, alumni, admin).

## 4. Apply Storage Rules

1. In the left sidebar, click **Storage**
2. Click the **Rules** tab
3. Paste the rules below and click **Publish**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read their own documents
    match /documents/{userId}/{allPaths=**} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId || isAdmin();
    }

    // Allow all authenticated to read avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId || isAdmin();
    }

    function isAdmin() {
      return request.auth != null && 
             get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. Click **Publish**

## 5. Create Firestore Collections (Optional - auto-created on first write)

When users sign up and create documents via the app, Firestore will automatically create collections. The expected collections are:

- `profiles/` — user profiles with role, verification status
- `jobs/` — job postings by alumni
- `events/` — events created by alumni
- `mentorship_requests/` — mentorship requests from students
- `conversations/` — 1:1 chat conversations
- `messages/` — messages within conversations (subcollection)

## 6. Verify Auth is Enabled

1. In the left sidebar, click **Authentication**
2. Click the **Sign-in method** tab
3. Ensure **Email/Password** is enabled
4. If not, click it and toggle **Enable**

## 7. Test the Setup

1. Go to your app at `http://localhost:3000`
2. Click "Sign up"
3. Create a test account with role "admin"
4. If successful, you should land on `/dashboard`
5. Create another account as "alumni" to test
6. With the admin account, go to `/admin/pending-verifications` and you should see the alumni account

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Check the Firestore Security Rules are published correctly
- Ensure rules reference the correct field names (`role`, `verified`)

### Error: "Cannot read property 'data' of undefined"
- This usually means the profile hasn't been created yet; sign up again and wait a moment
- Check browser console for more details

### Storage files not uploading
- Verify Storage rules are set to allow authenticated users to write
- Check that the file path matches the rules (e.g., `documents/{userId}/...`)

## Next Steps

After verifying auth works:
1. Implement document upload (`pages/profile/edit.tsx`)
2. Add job posting flow (`pages/jobs/post.tsx`)
3. Implement mentorship request & matching
4. Add real-time chat messaging

See `README.md` for development commands.
