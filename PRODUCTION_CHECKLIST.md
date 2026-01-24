# Production Deployment Checklist

## Before Deploying to Production

### 1. Google Cloud Console - OAuth Configuration

**URL**: https://console.cloud.google.com/apis/credentials?project=weight-tracker-7e67f

#### Add Production URLs to OAuth 2.0 Client ID

Click on your OAuth 2.0 Client ID, then add:

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

**Note**: Replace `your-production-domain.com` with your actual domain (e.g., Vercel URL like `weight-tracker.vercel.app`)

---

### 2. Environment Variables

#### Development (.env.local)

✅ Already configured for localhost

#### Production

Environment variables are configured in `.env.production.local` for Firebase Hosting:

**Current Firebase Hosting URLs:**
- Primary: https://weight-tracker-7e67f.web.app
- Alternative: https://weight-tracker-7e67f.firebaseapp.com

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=weight-tracker-7e67f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=weight-tracker-7e67f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=weight-tracker-7e67f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=315839479476
NEXT_PUBLIC_FIREBASE_APP_ID=1:315839479476:web:...

# Google Calendar API
NEXT_PUBLIC_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=315839479476-6qmlcgf5tjtoabjqmk1n7okhfro9ouqo.apps.googleusercontent.com
```

**For Firebase Hosting:**

Environment variables are stored in `.env.production.local` and bundled during build.
No separate hosting platform configuration needed.

---

### 3. OAuth Consent Screen - Publishing Status

**Current Status**: Testing (only whitelisted users can sign in)

**Options:**

#### Option A: Keep in Testing Mode (Recommended for Personal Use)

- Only test users can use the app
- No verification process required
- Add users at: https://console.cloud.google.com/apis/credentials/consent?project=weight-tracker-7e67f
- Maximum 100 test users

**Best for**: Personal use or small team

#### Option B: Publish to Production

- Anyone can use the app
- Requires Google verification process
- Can take weeks to get verified
- Must provide privacy policy, terms of service, etc.

**Best for**: Public-facing app

**To publish:**

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=weight-tracker-7e67f
2. Add required information:
   - Privacy Policy URL
   - Terms of Service URL
   - App homepage URL
3. Click "Publish App"
4. Submit for verification (if needed)

---

### 4. Firebase Configuration

#### Authorized Domains

Add your production domain to Firebase authorized domains:

1. Go to: https://console.firebase.google.com/project/weight-tracker-7e67f/authentication/settings
2. Under "Authorized domains", verify these domains are added:
   - `weight-tracker-7e67f.web.app` ✅
   - `weight-tracker-7e67f.firebaseapp.com` ✅
3. Add custom domain if needed

#### Storage CORS Configuration (for media uploads)

✅ Already configured in `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

To update CORS if needed:

```bash
gsutil cors set cors.json gs://weight-tracker-7e67f.firebasestorage.app
```

---

### 5. Security Review

#### Check Firestore Security Rules

Review your security rules to ensure they're production-ready:

**URL**: https://console.firebase.google.com/project/weight-tracker-7e67f/firestore/rules

Current rules should already be secure (user-specific access), but verify:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User's sub-collections
      match /{collection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

#### Check Storage Security Rules

If using Firebase Storage:

**URL**: https://console.firebase.google.com/project/weight-tracker-7e67f/storage/rules

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

---

### 6. Build and Test

#### Run Production Build Locally

```bash
npm run build
npm start
```

Test all features:

- [ ] Sign in/sign up
- [ ] Add weight entries
- [ ] Add body measurements
- [ ] Upload photos/videos
- [ ] Connect Google Calendar
- [ ] Create daily reminder
- [ ] Create monthly reminder
- [ ] Create weekly reminder
- [ ] Verify reminders appear in Google Calendar
- [ ] Disconnect calendar
- [ ] Sign out

---

### 7. Deployment Platform: Firebase Hosting

**Current Setup:** ✅ Already configured and deployed

**Deployment Commands:**

```bash
# Build and deploy
npm run build
firebase deploy --only hosting

# Or use the shortcut
npm run deploy
```

**Firebase Hosting Features:**

- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Custom domain support
- ✅ Automatic builds via `.next` output
- ✅ Version rollback support

**Production URLs:**
- Primary: https://weight-tracker-7e67f.web.app
- Alternative: https://weight-tracker-7e67f.firebaseapp.com

**Firebase Console:** https://console.firebase.google.com/project/weight-tracker-7e67f/hosting

---

### 8. Post-Deployment Verification

After deploying, test:

1. **Open production URL** in browser
2. **Sign in** with your account
3. **Connect Google Calendar**:
   - Should work without errors
   - Check OAuth redirect works correctly
4. **Enable a reminder**:
   - Should create event in Google Calendar
   - Check event appears correctly
5. **Refresh the page**:
   - Should stay connected (localStorage test)
   - Fields should remain editable
6. **Test on mobile device**:
   - PWA should install
   - All features should work

---

### 9. Monitoring and Maintenance

#### Set Up Monitoring

**Firebase Console:**

- Monitor authentication usage
- Check Firestore read/write operations
- Monitor storage usage

**Google Calendar API:**

- Monitor quota usage: https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas?project=weight-tracker-7e67f
- Daily quota: 1,000,000 requests/day
- Per-user quota: 1,000 requests/100 seconds

#### Regular Checks

- [ ] Review Firebase costs (monthly)
- [ ] Check for Firebase errors/warnings
- [ ] Monitor Google Calendar API quota
- [ ] Review OAuth consent screen for any warnings
- [ ] Keep dependencies updated

---

### 10. Rollback Plan

If something goes wrong:

1. **Revert OAuth URLs**: Remove production URLs from Google Cloud Console
2. **Disable deployment**: Use platform's rollback feature
3. **Check logs**: Review deployment and browser console logs
4. **Firebase Rules**: Revert to previous rules if needed

---

## Quick Deployment Summary

**Minimum steps for production:**

1. ✅ Build locally and test: `npm run build && npm start`
2. ✅ Add Firebase Hosting URLs to Google OAuth Client ID
3. ✅ Verify Firebase authorized domains include hosting URLs
4. ✅ Ensure `.env.production.local` has all environment variables
5. ✅ Deploy via Firebase: `npm run deploy`
6. ✅ Test OAuth flow on production URL
7. ✅ Add your email as test user (if staying in testing mode)
8. ✅ Test calendar integration end-to-end

---

## Common Production Issues

### Issue: OAuth redirect_uri_mismatch

**Solution**: Make sure production URL is added to "Authorized redirect URIs" in Google Cloud Console

### Issue: Calendar API not working in production

**Solution**:

- Check environment variables are set correctly
- Verify API key restrictions allow production domain
- Check browser console for CORS errors

### Issue: Firebase authentication not working

**Solution**: Add production domain to Firebase authorized domains

### Issue: "This app isn't verified" warning

**Solution**:

- Option 1: Add users as test users
- Option 2: Submit app for Google verification (takes time)

---

## Support Resources

- **Firebase Console**: https://console.firebase.google.com/project/weight-tracker-7e67f
- **Google Cloud Console**: https://console.cloud.google.com/?project=weight-tracker-7e67f
- **Next.js Documentation**: https://nextjs.org/docs
- **Firebase Hosting Docs**: https://firebase.google.com/docs/hosting
- **Firebase Documentation**: https://firebase.google.com/docs

---

## Final Checklist

Before going live, confirm:

- [x] Google OAuth URLs updated with Firebase Hosting URLs
- [x] Environment variables in `.env.production.local`
- [x] Firebase authorized domains include hosting URLs
- [x] Production build works locally
- [ ] All features tested in production
- [ ] OAuth flow works in production
- [ ] Calendar integration works in production
- [ ] Mobile/PWA tested
- [x] Firestore security rules reviewed and deployed
- [x] Storage security rules reviewed and deployed
- [ ] Monitoring set up
- [ ] Test users added (if in testing mode)

**You're ready to deploy! 🚀**
