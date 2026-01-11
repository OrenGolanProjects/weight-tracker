# Firebase Setup Instructions - COPY & PASTE THESE COMMANDS

## ✅ Files Already Created

- All Terraform configuration files
- Firestore security rules
- Storage security rules
- Firebase configuration

## 🚀 Commands to Run (Copy & Paste Each Section)

### Step 1: Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### Step 2: Create GCP Project & Enable Billing

```bash
# Create unique project ID
export PROJECT_ID="weight-tracker-$(date +%s)"
echo "Your Project ID: $PROJECT_ID"

# Create project
gcloud projects create $PROJECT_ID --name="Weight Tracker"
gcloud config set project $PROJECT_ID
```

**⚠️ STOP HERE!**

1. Go to: https://console.cloud.google.com/billing
2. Find your project "Weight Tracker"
3. Click "Link a billing account" (required even for free tier)
4. Then continue below ⬇️

### Step 3: Enable Required APIs

```bash
gcloud services enable firebase.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable identitytoolkit.googleapis.com
gcloud services enable storage.googleapis.com
```

### Step 4: Configure Terraform

```bash
cd "/Users/user/Library/CloudStorage/OneDrive-Personal/OrenFolder/Work develop/Train_followup/weight-tracker/terraform"

# Create terraform.tfvars with your project ID
cat > terraform.tfvars << EOF
project_id  = "$PROJECT_ID"
region      = "us-central1"
environment = "dev"
app_name    = "weight-tracker"
EOF

# Verify the file
cat terraform.tfvars
```

### Step 5: Run Terraform

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Create infrastructure (type 'yes' when prompted)
terraform apply

# Extract Firebase credentials to .env.local
terraform output -raw env_vars > ../.env.local
```

### Step 6: View Your Firebase Console

```bash
# Get your Firebase Console URL
terraform output firebase_console_url
```

**⚠️ MANUAL STEP - CRITICAL!**
Open the URL from above in your browser and do this:

1. Click **Authentication** → **Sign-in method**
2. Click **Google** provider
3. Toggle **Enable**
4. Click **Save**

5. Go to Google Cloud Console OAuth: https://console.cloud.google.com/apis/credentials/consent
6. Select **External** → **Create**
7. Fill in:
   - App name: **Weight Tracker**
   - User support email: **orenuki@gmail.com**
   - Developer contact: **orenuki@gmail.com**
8. Click **Save and Continue** (skip through the rest)
9. Add test user: **orenuki@gmail.com**
10. Click **Publish App** (optional, or keep in testing mode)

### Step 7: Deploy Security Rules

```bash
cd "/Users/user/Library/CloudStorage/OneDrive-Personal/OrenFolder/Work develop/Train_followup/weight-tracker"

# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select your project
firebase use --add
# (Choose your project from the list and give it alias "default")

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules
```

### Step 8: Test the App! 🎉

```bash
# Start development server
pnpm dev
```

Then open http://localhost:3000 and sign in with **orenuki@gmail.com**

---

## 🎯 Quick Reference

If you get lost, here's the order:

1. ✅ Authenticate (gcloud auth)
2. ✅ Create project
3. ⚠️ Enable billing (manual in browser)
4. ✅ Enable APIs
5. ✅ Run Terraform
6. ⚠️ Enable Google OAuth (manual in browser)
7. ✅ Deploy security rules
8. ✅ Test app

---

## 🆘 Troubleshooting

**"Billing account required"**
→ Go to https://console.cloud.google.com/billing and link billing

**"API not enabled"**
→ Re-run Step 3 commands

**"Permission denied"**
→ Re-run: `gcloud auth application-default login`

**"Can't sign in with Google"**
→ Make sure you completed the manual OAuth step in Step 6

---

Ready to start! Let me know when you're done with each step or if you hit any errors.
