provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable necessary APIs
resource "google_project_service" "cloud_run" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secret_manager" {
  service = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# Secret Manager - Private Key
resource "google_secret_manager_secret" "private_key" {
  secret_id = "xodos-private-key"
  replication {
    automatic = true
  }
  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "private_key_version" {
  secret = google_secret_manager_secret.private_key.id
  secret_data = var.private_key_initial_value # Pass dummy or initial value
}

# Cloud Run Service
resource "google_cloud_run_service" "default" {
  name     = "xodos-api"
  location = var.region

  template {
    spec {
      containers {
        image = var.image_name
        
        env {
          name = "POLYGON_RPC_URL"
          value = var.polygon_rpc_url
        }
        
        env {
          name = "CONTRACT_ADDRESS"
          value = var.contract_address
        }

        env {
            name = "PRIVATE_KEY"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.private_key.secret_id
                key  = "latest"
              }
            }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.cloud_run]
}

# Allow unauthenticated access (Public API)
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.default.location
  project     = google_cloud_run_service.default.project
  service     = google_cloud_run_service.default.name
  policy_data = data.google_iam_policy.noauth.policy_data
}
