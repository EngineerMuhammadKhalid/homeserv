# Firebase Configuration Setup Guide

## 1. Deploy Updated Firestore Rules

The firestore rules have been updated to allow admins to seed data.

**Command:**
```bash
firebase deploy --only firestore:rules
```

---

## 2. Configure Firebase Storage CORS

Firebase Storage needs CORS configuration to allow image uploads from localhost and your domain.

### Option A: Using gsutil (Recommended)

1. Install Google Cloud SDK if not already installed:
   ```bash
   # On macOS with Homebrew
   brew install --cask google-cloud-sdk
   
   # On Ubuntu/Debian
   curl https://sdk.cloud.google.com | bash
   ```

2. Initialize gcloud and authenticate:
   ```bash
   gcloud init
   gcloud auth login
   ```

3. Set your project:
   ```bash
   gcloud config set project modular-magpie-424219-p4
   ```

4. Apply CORS configuration:
   ```bash
   gsutil cors set cors.json gs://modular-magpie-424219-p4.firebasestorage.app
   ```

5. Verify CORS configuration:
   ```bash
   gsutil cors get gs://modular-magpie-424219-p4.firebasestorage.app
   ```

### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `modular-magpie-424219-p4`
3. Go to Storage
4. Click on the bucket: `modular-magpie-424219-p4.firebasestorage.app`
5. Go to Settings tab
6. Scroll to CORS configuration
7. Add the following configuration as JSON:
   ```json
   [
     {
       "origin": [
         "http://localhost:3000",
         "http://localhost:3100",
         "http://localhost:5173",
         "http://127.0.0.1:3000",
         "http://127.0.0.1:5173"
       ],
       "method": ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"],
       "responseHeader": ["Content-Type", "Authorization", "x-goog-meta-*"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

---

## 3. Issues Fixed

✅ **Firestore Permission Errors**
- Updated rules to allow admins (`isAdmin()`) to create seed data
- Removed "Missing or insufficient permissions" errors for seeding

✅ **Firebase Storage CORS Errors**
- Added CORS configuration for localhost development
- Enables image uploads for profile photos and portfolio

✅ **MUI Grid Deprecation Warnings**
- Replaced deprecated Grid v1 (`item`, `xs`, `sm`, `md` props)
- Using MUI v2 responsive `Box` with `gridTemplateColumns`
- Eliminated console warnings about removed props

---

## 4. Test the Setup

1. **Profile Photo Upload**: Go to `/professional-profile` → Upload profile photo
2. **Portfolio Images**: Click "Add work sample" → Upload image
3. **Seed Data**: Check browser console to see if seed data loads without permission errors

---

## Notes

- The `cors.json` file is in the project root
- CORS configuration takes effect immediately
- For production, update the `origin` array with your domain (e.g., "https://yourdomain.com")
- All images are stored in Firebase Storage and served with proper permissions

