# Enable Firebase for the project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

# Create Firebase Web App
resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "${var.app_name}-${var.environment}"

  depends_on = [google_firebase_project.default]
}

# Get Firebase Web App config
data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.default.app_id
}
