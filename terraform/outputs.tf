output "firebase_config" {
  description = "Firebase configuration for .env.local"
  value = {
    api_key             = data.google_firebase_web_app_config.default.api_key
    auth_domain         = data.google_firebase_web_app_config.default.auth_domain
    project_id          = var.project_id
    storage_bucket      = lookup(data.google_firebase_web_app_config.default, "storage_bucket", "${var.project_id}.appspot.com")
    messaging_sender_id = data.google_firebase_web_app_config.default.messaging_sender_id
    app_id              = google_firebase_web_app.default.app_id
  }
  sensitive = true
}

output "env_vars" {
  description = "Environment variables for .env.local (copy to clipboard)"
  value = <<-EOT
    NEXT_PUBLIC_FIREBASE_API_KEY=${data.google_firebase_web_app_config.default.api_key}
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${data.google_firebase_web_app_config.default.auth_domain}
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=${var.project_id}
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${var.project_id}.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${data.google_firebase_web_app_config.default.messaging_sender_id}
    NEXT_PUBLIC_FIREBASE_APP_ID=${google_firebase_web_app.default.app_id}
  EOT
  sensitive = true
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "firebase_console_url" {
  description = "Firebase Console URL"
  value       = "https://console.firebase.google.com/project/${var.project_id}"
}
