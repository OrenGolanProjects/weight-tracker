# Google Calendar Integration Setup Guide

This guide will walk you through setting up Google Calendar API credentials for the Weight Tracker app.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your Firebase project ID: `weight-tracker-7e67f`

## Step-by-Step Setup

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your Firebase project: **weight-tracker-7e67f**
   - If you don't see it, click the project dropdown at the top and select it

### Step 2: Enable Google Calendar API

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on **Google Calendar API**
4. Click the **ENABLE** button
5. Wait for the API to be enabled

### Step 3: Create OAuth 2.0 Client ID

1. In the left sidebar, click **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**

#### Configure OAuth Consent Screen (if prompted)

If this is your first time, you'll need to configure the OAuth consent screen:

1. Click **CONFIGURE CONSENT SCREEN**
2. Select **External** (for testing) or **Internal** (if you have Google Workspace)
3. Click **CREATE**
4. Fill in the required fields:
   - **App name:** Weight Tracker
   - **User support email:** Your email
   - **Developer contact information:** Your email
5. Click **SAVE AND CONTINUE**
6. On the Scopes page, click **SAVE AND CONTINUE** (no custom scopes needed)
7. On the Test users page, add your email address, click **SAVE AND CONTINUE**
8. Click **BACK TO DASHBOARD**

#### Create the OAuth Client ID

1. Go back to **Credentials** tab
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type:** **Web application**
4. **Name:** `Weight Tracker Calendar Integration`
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:

   ```
   http://localhost:3000
   ```

   (For production, also add: `https://weight-tracker-7e67f.web.app`)

6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:

   ```
   http://localhost:3000/settings
   ```

   (For production, also add: `https://weight-tracker-7e67f.web.app/settings`)

7. Click **CREATE**
8. **IMPORTANT:** Copy the **Client ID** that appears (it will look like: `123456789-abc123.apps.googleusercontent.com`)
9. Click **OK**

### Step 4: Create API Key

1. Still in **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **API key**
4. **IMPORTANT:** Copy the **API key** that appears
5. Click **RESTRICT KEY** (recommended for security)
6. Give it a name: `Weight Tracker Calendar Key`
7. Under **API restrictions**, select **Restrict key**
8. In the dropdown, find and check **Google Calendar API**
9. Click **SAVE**

### Step 5: Configure Environment Variables

1. Open your project folder: `/Users/user/Library/CloudStorage/OneDrive-Personal/OrenFolder/Work develop/Train_followup/weight-tracker/`
2. Edit the `.env.local` file
3. Replace the placeholder values with your actual credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=weight-tracker-7e67f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=weight-tracker-7e67f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=weight-tracker-7e67f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=315839479476
NEXT_PUBLIC_FIREBASE_APP_ID=1:315839479476:web:8c82b704a94e2db8faa1e1

# Google Calendar API Configuration
NEXT_PUBLIC_GOOGLE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com
```

4. Save the file

### Step 6: Restart Development Server

1. Stop your development server (Ctrl+C / Cmd+C)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 7: Test the Integration

1. Open your app: http://localhost:3000
2. Click the **Settings icon** (⚙️) in the top navigation bar
3. You should see the Settings page
4. Click **"Connect Google Calendar"**
5. A Google OAuth popup should appear
6. Grant calendar permissions
7. You should see "Connected" status
8. Enable reminders and set your preferred times!

## Troubleshooting

### Error: "idpiframe_initialization_failed"

This means the OAuth Client ID is not configured correctly. Check:

- You added http://localhost:3000 to Authorized JavaScript origins
- You copied the Client ID correctly
- You restarted the dev server

### Error: "API Key not configured"

- Make sure you copied the API key exactly (no extra spaces)
- Restart the dev server after updating .env.local

### Error: "Redirect URI mismatch"

- Make sure you added http://localhost:3000/settings to Authorized redirect URIs
- Check for typos in the URL

### Error: "Access blocked: This app's request is invalid"

- Complete the OAuth Consent Screen configuration
- Add yourself as a test user if using External user type

## Production Deployment

For production deployment, remember to:

1. Add production URLs to OAuth Client ID:
   - Authorized JavaScript origins: `https://weight-tracker-7e67f.web.app`
   - Authorized redirect URIs: `https://weight-tracker-7e67f.web.app/settings`

2. Update `.env.production.local` with the same credentials

3. Publish your OAuth Consent Screen (if you want it available to all users)

## Security Notes

- **Never commit** `.env.local` or `.env.production.local` to git
- API keys and client IDs are already public-facing (that's their purpose)
- Restrict your API key to only Calendar API for better security
- Use domain restrictions in production

## Need Help?

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify all credentials are copied correctly
3. Ensure you enabled the Google Calendar API
4. Make sure you restarted the dev server after changing .env.local

The Settings page now shows a warning banner with setup instructions if credentials are not configured.
