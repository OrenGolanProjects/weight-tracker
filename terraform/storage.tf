# Enable Storage API
resource "google_project_service" "storage" {
  project = var.project_id
  service = "storage.googleapis.com"

  disable_on_destroy = false
}

# Firebase Storage bucket is auto-created with Firebase project
# We just need to enable the API

# Optional: Create a specific storage bucket if needed
# resource "google_storage_bucket" "default" {
#   name     = "${var.project_id}.appspot.com"
#   location = var.region
#   project  = var.project_id
#
#   depends_on = [google_project_service.storage]
# }
