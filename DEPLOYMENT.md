# Deployment Guide - Firebase Hosting

This guide covers deploying the Weight Tracker app to Firebase Hosting.

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally

   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Ensure you have a Firebase project created at [Firebase Console](https://console.firebase.google.com)

3. **Firebase Login**: Authenticate with Firebase

   ```bash
   firebase login
   ```

4. **Firebase Project Initialization**: If not already initialized, run:

   ```bash
   firebase init
   ```

   - Select: Hosting, Firestore, Storage
   - Use existing project
   - Public directory: `out`
   - Configure as SPA: Yes
   - Set up automatic builds: No (we handle builds manually)

## Environment Variables Setup

### Development (.env.local)

1. Create `.env.local` file in the project root (already gitignored)
2. Copy values from `.env.production.example`
3. Fill in your Firebase development project credentials from Firebase Console

### Production (.env.production.local)

1. Create `.env.production.local` file in the project root
2. Copy the template:
   ```bash
   cp .env.production.example .env.production.local
   ```
3. Get your Firebase configuration from Firebase Console:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the Firebase config values
4. Fill in all the values in `.env.production.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

## Build Configuration

The app is configured for static export in `next.config.ts`:

```typescript
{
  output: 'export',           // Static HTML export
  images: { unoptimized: true }, // Required for static export
  trailingSlash: true,        // Match Firebase hosting
}
```

## Deployment Scripts

The following scripts are available in `package.json`:

### 1. Build Static Export

```bash
pnpm run export
```

Creates a static build in the `out/` directory.

### 2. Deploy to Production

```bash
pnpm run deploy
```

Builds and deploys to your Firebase Hosting production site.

### 3. Deploy to Preview Channel

```bash
pnpm run deploy:preview
```

Builds and deploys to a preview channel for testing before production.

### 4. Deploy All Firebase Services

```bash
pnpm run deploy:full
```

Builds and deploys hosting + updates Firestore rules and Storage rules.

## Step-by-Step Deployment

### First Time Deployment

1. **Verify Firebase configuration**

   ```bash
   firebase projects:list
   ```

   Ensure you're connected to the correct project.

2. **Set up environment variables**
   - Create `.env.production.local` with production Firebase credentials
   - Verify variables are prefixed with `NEXT_PUBLIC_`

3. **Test the build locally**

   ```bash
   pnpm run export
   ```

   Check the `out/` directory for generated files.

4. **Preview locally** (optional)

   ```bash
   firebase serve
   ```

   Opens local preview at http://localhost:5000

5. **Deploy to production**

   ```bash
   pnpm run deploy
   ```

6. **Verify deployment**
   - Visit your Firebase Hosting URL (shown in terminal output)
   - Test authentication, data loading, and image uploads
   - Check browser console for errors

### Subsequent Deployments

For regular updates:

```bash
# Quick deploy (hosting only)
pnpm run deploy

# Or deploy with Firestore/Storage rule updates
pnpm run deploy:full
```

### Preview Channel Deployment (Recommended)

Test changes before production:

```bash
# Deploy to preview channel
pnpm run deploy:preview

# Share the preview URL with testers
# URL format: https://your-project--preview-xxxxx.web.app

# When ready, deploy to production
pnpm run deploy
```

## Firebase Hosting Configuration

The `firebase.json` file configures hosting behavior:

```json
{
  "hosting": {
    "public": "out", // Next.js export directory
    "cleanUrls": true, // Remove .html from URLs
    "trailingSlash": true, // Add trailing slash to URLs
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html" // SPA routing
      }
    ],
    "headers": [
      // Cache static assets for 1 year
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      // Don't cache service worker
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

## PWA Considerations

### Before First Deployment

The app requires PWA icons to be added to the `public/` directory:

1. Create or generate the following icons:
   - `icon-192x192.png` (192x192 pixels)
   - `icon-512x512.png` (512x512 pixels)
   - `favicon.ico` (32x32 pixels)

2. See `PWA_ICONS_README.md` for detailed icon creation instructions

3. Verify `manifest.json` references the correct icon paths

### Service Worker

The service worker (`public/sw.js`) will automatically register on production builds. It caches essential routes for offline access.

## Firestore and Storage Rules

The app includes security rules for Firestore and Storage:

### Firestore Rules (`firestore.rules`)

- User profiles: Read/write own profile only
- Weight entries: Read/write own entries only
- Body measurements: Read/write own measurements only
- Progress media: Read/write own media only

### Storage Rules (`storage.rules`)

- Images: Authenticated users can upload to their own folder
- File size limit: 10MB per file
- Allowed types: Images and videos

To deploy rule updates:

```bash
pnpm run deploy:full
```

## Troubleshooting

### Build Fails

**Error**: Module not found or TypeScript errors

```bash
# Clear cache and reinstall
rm -rf .next out node_modules
pnpm install
pnpm run ai-check
```

**Error**: Environment variables not found

- Verify `.env.production.local` exists
- Check all variables are prefixed with `NEXT_PUBLIC_`
- Rebuild after adding variables

### Deployment Fails

**Error**: "Firebase project not found"

```bash
firebase use --add
# Select your project from the list
```

**Error**: "Permission denied"

```bash
firebase login --reauth
```

### Runtime Errors After Deploy

**Error**: Firebase not initialized

- Verify environment variables are set in `.env.production.local`
- Check Firebase config in browser DevTools console
- Ensure build included the environment variables

**Error**: 404 on page refresh

- Verify rewrites are configured in `firebase.json`
- Check `trailingSlash: true` in both `next.config.ts` and `firebase.json`

**Error**: Images not loading

- Images must be in `public/` directory
- Use `unoptimized: true` in `next.config.ts`
- Check browser console for CORS errors

### Service Worker Issues

**Error**: Service worker not registering

- Only registers in production mode
- Check browser console for registration errors
- Verify `sw.js` is in `public/` directory

**Error**: Old version cached

```bash
# Clear browser cache and service worker
# Chrome DevTools > Application > Clear storage > Clear site data
```

## Custom Domain Setup (Optional)

To use a custom domain:

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Add DNS records to your domain provider
5. Wait for SSL certificate provisioning (can take up to 24 hours)

## Monitoring

### Firebase Console

Monitor your deployment at [Firebase Console](https://console.firebase.google.com):

- **Hosting**: View deployment history, traffic, and domain settings
- **Authentication**: Monitor user sign-ups and authentication methods
- **Firestore**: View database usage and query performance
- **Storage**: Monitor storage usage and file uploads

### Performance Monitoring (Optional)

Add Firebase Performance Monitoring:

```bash
pnpm add firebase
```

## CI/CD Integration (Optional)

For automated deployments with GitHub Actions:

1. Generate Firebase token:

   ```bash
   firebase login:ci
   ```

2. Add token to GitHub Secrets as `FIREBASE_TOKEN`

3. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to Firebase
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm install -g pnpm
         - run: pnpm install
         - run: pnpm run export
         - uses: FirebaseExtended/action-hosting-deploy@v0
           with:
             repoToken: '${{ secrets.GITHUB_TOKEN }}'
             firebaseServiceAccount: '${{ secrets.FIREBASE_TOKEN }}'
             projectId: your-project-id
   ```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.production.local` to git
   - Use different Firebase projects for dev/production
   - Rotate API keys if accidentally exposed

2. **Firestore Security**
   - Test security rules in Firebase Console
   - Limit data access to authenticated users only
   - Use field-level validation

3. **Storage Security**
   - Enforce file size limits
   - Validate file types on upload
   - Use authenticated upload URLs

4. **Authentication**
   - Enable only necessary sign-in methods
   - Configure authorized domains in Firebase Console
   - Monitor authentication logs for suspicious activity

## Production Checklist

Before going live:

- [ ] PWA icons added to `public/` directory
- [ ] `.env.production.local` configured with production Firebase credentials
- [ ] Build tested locally (`pnpm run export`)
- [ ] Preview deployment tested (`pnpm run deploy:preview`)
- [ ] Firestore security rules deployed and tested
- [ ] Storage security rules deployed and tested
- [ ] Authentication methods configured in Firebase Console
- [ ] Custom domain configured (if applicable)
- [ ] Error tracking/monitoring set up
- [ ] Service worker tested on mobile devices

## Support

For issues or questions:

- Check Firebase documentation: https://firebase.google.com/docs
- Review Next.js static export docs: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- Check GitHub issues for this project
