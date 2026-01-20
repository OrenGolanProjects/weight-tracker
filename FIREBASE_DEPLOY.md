# Firebase Hosting - Production Deployment Guide

## Your Firebase Project

- **Project ID**: weight-tracker-7e67f
- **Default URL**: https://weight-tracker-7e67f.web.app
- **Alt URL**: https://weight-tracker-7e67f.firebaseapp.com

---

## 🚀 Quick Deploy Steps

### 1. Build the Production App

```bash
npm run build
```

This creates the static export in the `out/` directory.

### 2. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or deploy everything (hosting + rules):

```bash
firebase deploy
```

---

## ⚙️ Pre-Deployment Configuration

### 1. Update Google OAuth Settings (CRITICAL!)

Go to: https://console.cloud.google.com/apis/credentials?project=weight-tracker-7e67f

Click on your OAuth 2.0 Client ID and add these production URLs:

**Authorized JavaScript origins:**

```
http://localhost:3000
https://weight-tracker-7e67f.web.app
https://weight-tracker-7e67f.firebaseapp.com
```

**Authorized redirect URIs:**

```
http://localhost:3000/settings
https://weight-tracker-7e67f.web.app/settings
https://weight-tracker-7e67f.firebaseapp.com/settings
```

**Important**: If you have a custom domain, add those URLs too!

---

### 2. Verify Firebase Authorized Domains

Go to: https://console.firebase.google.com/project/weight-tracker-7e67f/authentication/settings

Under "Authorized domains", make sure these are listed:

- `weight-tracker-7e67f.web.app`
- `weight-tracker-7e67f.firebaseapp.com`
- `localhost` (for development)

These should already be added automatically by Firebase, but verify.

---

### 3. Review Security Rules

#### Firestore Rules

Your current `firestore.rules` should be production-ready:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{collection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

#### Storage Rules

Your current `storage.rules` should be production-ready:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only storage
```

---

## 📦 Complete Deployment Process

### Step-by-Step:

1. **Build the app**

   ```bash
   npm run build
   ```

   Verify `out/` directory was created with all files.

2. **Test locally (optional)**

   ```bash
   firebase serve
   ```

   This serves from the `out/` directory locally.

3. **Deploy to production**

   ```bash
   firebase deploy
   ```

   This deploys:
   - Hosting (static files from `out/`)
   - Firestore rules
   - Storage rules

4. **Verify deployment**
   - Open: https://weight-tracker-7e67f.web.app
   - Test sign in
   - Test calendar connection
   - Verify reminders work

---

## 🔧 Environment Variables

**Good news**: Since you're using Next.js static export with Firebase, all your environment variables are already baked into the build during `npm run build`. They're read from your `.env.local` file.

**No additional configuration needed!**

Your `.env.local` contains:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=weight-tracker-7e67f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=weight-tracker-7e67f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=weight-tracker-7e67f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=315839479476
NEXT_PUBLIC_FIREBASE_APP_ID=1:315839479476:web:8c82b704a94e2db8faa1e1
NEXT_PUBLIC_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=315839479476-6qmlcgf5tjtoabjqmk1n7okhfro9ouqo.apps.googleusercontent.com
```

These are already public (exposed to browser), so it's safe.

---

## 🎯 OAuth App Status

### Current: Testing Mode

Your OAuth app is in **Testing** mode, which means:

- ✅ Only test users can sign in
- ✅ No verification needed
- ✅ Works immediately
- ✅ Your email (orenuki@gmail.com) is already whitelisted

### To Add More Users (if needed):

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=weight-tracker-7e67f
2. Scroll to "Test users"
3. Click "Add Users"
4. Enter email addresses
5. Save

---

## ✅ Post-Deployment Testing

After deploying, test these features:

### 1. Basic Functionality

- [ ] Open https://weight-tracker-7e67f.web.app
- [ ] Sign in with your email
- [ ] Add a weight entry
- [ ] Add body measurements
- [ ] Upload a photo/video

### 2. Calendar Integration (MOST IMPORTANT)

- [ ] Go to Settings page
- [ ] Click "Connect Google Calendar"
- [ ] OAuth flow completes successfully
- [ ] Enable daily reminder
- [ ] Check Google Calendar - event should appear
- [ ] Refresh the page - should stay connected
- [ ] Enable weekly reminder - should NOT create duplicates
- [ ] Enable monthly reminder - should NOT create duplicates
- [ ] Verify 3 separate events in Google Calendar (no duplicates)

### 3. PWA Features

- [ ] Install as PWA on desktop
- [ ] Install as PWA on mobile
- [ ] Test offline functionality (should show cached data)

### 4. Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test responsive design
- [ ] Test touch interactions

---

## 🔍 Troubleshooting Production Issues

### Issue: OAuth "redirect_uri_mismatch" Error

**Cause**: Production URLs not added to OAuth settings

**Fix**:

1. Go to: https://console.cloud.google.com/apis/credentials?project=weight-tracker-7e67f
2. Add `https://weight-tracker-7e67f.web.app/settings` to Authorized redirect URIs
3. Add `https://weight-tracker-7e67f.web.app` to Authorized JavaScript origins

### Issue: "This app isn't verified" Warning

**Expected**: This is normal in testing mode

**Solution**:

- Click "Advanced" → "Go to Weight Tracker (unsafe)"
- OR add the user as a test user
- OR publish app to production (requires verification)

### Issue: Calendar Events Not Creating

**Check**:

1. Browser console for errors
2. OAuth token in localStorage (F12 → Application → Local Storage)
3. Google Calendar API quota: https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas?project=weight-tracker-7e67f

### Issue: Page Not Found (404)

**Cause**: Next.js routing issue

**Fix**: Your `firebase.json` already has the correct rewrite rule:

```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

If still not working, rebuild and redeploy:

```bash
npm run build
firebase deploy --only hosting
```

---

## 📊 Monitoring Production

### Firebase Console

https://console.firebase.google.com/project/weight-tracker-7e67f

**Monitor**:

- Authentication: Active users, sign-ins
- Firestore: Read/write operations, storage usage
- Storage: Files stored, bandwidth used
- Hosting: Bandwidth, requests

### Google Calendar API Quota

https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas?project=weight-tracker-7e67f

**Limits**:

- 1,000,000 requests per day
- 1,000 requests per 100 seconds per user

### Cost Monitoring

https://console.firebase.google.com/project/weight-tracker-7e67f/usage

Firebase free tier (Spark Plan) includes:

- **Firestore**: 50K reads/day, 20K writes/day, 1GB storage
- **Storage**: 5GB storage, 1GB/day download
- **Hosting**: 10GB/month transfer

**Upgrade to Blaze (pay-as-you-go) if needed**

---

## 🔄 Updating Production

### Regular Updates:

```bash
# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Build
npm run build

# 4. Deploy
firebase deploy --only hosting
```

### Deploy Only Rules (no code changes):

```bash
firebase deploy --only firestore:rules,storage
```

### Rollback to Previous Version:

```bash
firebase hosting:rollback
```

---

## 🌐 Custom Domain (Optional)

If you want to use a custom domain:

### 1. Add Domain in Firebase

1. Go to: https://console.firebase.google.com/project/weight-tracker-7e67f/hosting
2. Click "Add custom domain"
3. Follow the setup wizard
4. Add DNS records to your domain registrar

### 2. Update OAuth Settings

Add your custom domain to:

- Authorized JavaScript origins
- Authorized redirect URIs

### 3. Update Firebase Authorized Domains

Add your custom domain to Firebase Authentication settings

---

## 📋 Complete Deployment Checklist

Before deploying:

- [ ] Code tested locally (`npm run dev`)
- [ ] Production build works (`npm run build`)
- [ ] Google OAuth URLs updated with Firebase Hosting URLs
- [ ] Firebase authorized domains verified
- [ ] Firestore rules reviewed
- [ ] Storage rules reviewed

Deploying:

- [ ] Run `firebase deploy`
- [ ] Deployment succeeds without errors
- [ ] Note the hosting URL in output

After deploying:

- [ ] Open production URL in browser
- [ ] Sign in works
- [ ] Add test data (weight, measurements, media)
- [ ] Connect Google Calendar
- [ ] Create all 3 reminder types
- [ ] Verify no duplicates in Google Calendar
- [ ] Refresh page - should stay connected
- [ ] Test on mobile device
- [ ] Test PWA installation

---

## 🎉 You're Ready!

Your Firebase app is configured and ready to deploy.

**One-line deploy command:**

```bash
npm run build && firebase deploy
```

**Production URL after deploy:**

- https://weight-tracker-7e67f.web.app
- https://weight-tracker-7e67f.firebaseapp.com

**Don't forget**: Update the Google OAuth URLs before testing calendar integration!

---

## 🆘 Need Help?

- **Firebase Console**: https://console.firebase.google.com/project/weight-tracker-7e67f
- **Google Cloud Console**: https://console.cloud.google.com/?project=weight-tracker-7e67f
- **Firebase CLI Docs**: https://firebase.google.com/docs/cli
- **Firebase Hosting Docs**: https://firebase.google.com/docs/hosting
