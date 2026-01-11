# Enable Identity Toolkit API (Firebase Auth)
resource "google_project_service" "identity_toolkit" {
  project = var.project_id
  service = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

# Note: Google OAuth provider configuration must be done manually in Firebase Console
# or using Firebase CLI, as Terraform doesn't fully support this configuration yet.
#
# Manual steps required:
# 1. Go to Firebase Console > Authentication > Sign-in method
# 2. Enable Google provider
# 3. Configure OAuth consent screen in Google Cloud Console
# 4. Add authorized domains (localhost, your production domain)
