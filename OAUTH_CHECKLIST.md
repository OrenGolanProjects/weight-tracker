# OAuth Setup Checklist

## Current Configuration

- **Project ID**: weight-tracker-7e67f
- **OAuth Client ID**: 315839479476-6qmlcgf5tjtoabjqmk1n7okhfro9ouqo.apps.googleusercontent.com
- **API Key**: YOUR_GOOGLE_API_KEY

## Steps to Fix "Google hasn't verified this app" Warning

### Option A: Add Test User (Recommended)

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=weight-tracker-7e67f
2. Verify:
   - Publishing status: **Testing**
   - User type: **External** (or Internal if you have Workspace)
3. Scroll to **Test users** section
4. Click **+ ADD USERS**
5. Enter: `orenuki@gmail.com`
6. Click **SAVE**
7. Click **SAVE** again at bottom

**Result**: No more warning screen for your email!

### Option B: Click "Advanced" (Temporary)

On the warning screen:

1. Look at bottom left for **"Advanced"** link (small blue text)
2. Click **"Advanced"**
3. Click **"Go to Weight Tracker (unsafe)"**
4. Grant permissions

**Note**: You'll see this warning every time unless you do Option A.

---

## Verify These Settings

### 1. OAuth Consent Screen

URL: https://console.cloud.google.com/apis/credentials/consent?project=weight-tracker-7e67f

**Required fields:**

- App name: Weight Tracker
- User support email: orenuki@gmail.com
- Developer contact: orenuki@gmail.com
- Publishing status: Testing
- **Test users: orenuki@gmail.com** ← MOST IMPORTANT

### 2. OAuth 2.0 Client ID

URL: https://console.cloud.google.com/apis/credentials?project=weight-tracker-7e67f

**Authorized JavaScript origins:**

```
http://localhost:3000
```

**Authorized redirect URIs:**

```
http://localhost:3000/settings
```

### 3. API Key Restrictions

URL: https://console.cloud.google.com/apis/credentials?project=weight-tracker-7e67f

Find your API key and verify:

- Name: Weight Tracker Calendar Key (or similar)
- API restrictions: **Restrict key**
- Selected APIs: **Google Calendar API** ✓

### 4. Calendar API Enabled

URL: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=weight-tracker-7e67f

- Status: **API enabled** (green checkmark)

---

## Testing After Setup

1. **Restart dev server**: Stop (Ctrl+C) and run `npm run dev`
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Go to Settings**: http://localhost:3000/settings
4. **Click "Connect Google Calendar"**
5. **Should work now!**

If you added yourself as test user (Option A), you won't see the warning.
If you didn't, click "Advanced" → "Go to Weight Tracker (unsafe)"

---

## Common Issues

### "The app is in testing mode"

- This is normal! You added yourself as a test user.
- Only test users can use the app in testing mode.

### "Advanced" link not visible

- Try different browser (Chrome works best)
- Use incognito/private mode
- Or add yourself as test user (Option A above)

### "redirect_uri_mismatch"

- Check authorized redirect URIs in OAuth Client ID
- Must be exactly: `http://localhost:3000/settings`
- No trailing slash, no extra characters

### "idpiframe_initialization_failed"

- Check OAuth Client ID is correct in .env.local
- Check authorized JavaScript origins is correct
- Clear browser cache and restart dev server

---

## Quick Links

- [Google Cloud Console](https://console.cloud.google.com/?project=weight-tracker-7e67f)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=weight-tracker-7e67f)
- [Credentials](https://console.cloud.google.com/apis/credentials?project=weight-tracker-7e67f)
- [Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=weight-tracker-7e67f)

---

## Need More Help?

Run this in your terminal to verify environment variables are loaded:

```bash
npm run dev
```

Then check browser console (F12) for error messages.
