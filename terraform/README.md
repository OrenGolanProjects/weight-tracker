# Terraform Configuration for Weight Tracker Firebase Infrastructure

This directory contains Terraform configuration to provision Firebase infrastructure for the Weight Tracker app.

## Prerequisites

1. **Install Terraform**

   ```bash
   # macOS
   brew install terraform

   # Or download from https://www.terraform.io/downloads
   ```

2. **Install Google Cloud SDK**

   ```bash
   brew install --cask google-cloud-sdk
   ```

3. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

## Setup Instructions

### Step 1: Create GCP Project

```bash
# Set a unique project ID
export PROJECT_ID="weight-tracker-$(date +%s)"

# Create the project
gcloud projects create $PROJECT_ID --name="Weight Tracker"

# Set as default project
gcloud config set project $PROJECT_ID

# Enable billing (required for Firebase)
# Go to: https://console.cloud.google.com/billing
# Link billing account to your project
```

### Step 2: Enable Required APIs

```bash
gcloud services enable firebase.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable identitytoolkit.googleapis.com
gcloud services enable storage.googleapis.com
```

### Step 3: Configure Terraform Variables

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your project ID
# Replace "your-project-id-here" with your actual project ID
```

### Step 4: Initialize Terraform

```bash
cd terraform
terraform init
```

### Step 5: Plan Infrastructure

```bash
terraform plan
```

Review the plan to ensure everything looks correct.

### Step 6: Apply Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to create the infrastructure.

### Step 7: Get Firebase Configuration

```bash
# View the Firebase config
terraform output firebase_config

# Copy environment variables directly
terraform output -raw env_vars > ../.env.local
```

### Step 8: Manual Configuration (Firebase Console)

1. Go to Firebase Console: `terraform output firebase_console_url`
2. Navigate to **Authentication > Sign-in method**
3. Enable **Google** provider
4. Configure OAuth consent screen in Google Cloud Console
5. Add authorized domains:
   - `localhost` (for development)
   - Your production domain (when deployed)

## Terraform Commands Reference

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output
terraform output firebase_config
terraform output -raw env_vars

# Destroy infrastructure (BE CAREFUL!)
terraform destroy
```

## What Gets Created

- **Firebase Project:** Enables Firebase for your GCP project
- **Firebase Web App:** Creates a web app registration
- **Firestore Database:** NoSQL database for storing data
- **Firebase Authentication:** Enables user authentication
- **Firebase Storage:** Storage bucket for photos/videos

## Security Rules

After Terraform creates the infrastructure, you need to deploy security rules:

```bash
# From the project root directory
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

Or manually add rules in Firebase Console.

## Troubleshooting

### "Billing account required"

Firebase requires a billing account (even for free tier). Link a billing account in Google Cloud Console.

### "API not enabled"

Run the API enable commands from Step 2 again.

### "Permission denied"

Ensure you're authenticated with `gcloud auth application-default login`

### "Project already exists"

Choose a different project ID in terraform.tfvars

## Cost

Everything provisioned by this Terraform configuration is on Firebase's **FREE Spark plan**. No costs incurred for infrastructure itself, but ensure you stay within free tier limits:

- Firestore: 50k reads, 20k writes per day
- Storage: 5 GB storage, 1 GB downloads per day
- Authentication: Unlimited Google sign-ins

## Next Steps

After Terraform completes:

1. ✅ Firebase infrastructure created
2. ✅ Environment variables in `.env.local`
3. ⏳ Enable Google OAuth in Firebase Console (manual step)
4. ⏳ Deploy security rules
5. ⏳ Test authentication with `pnpm dev`
