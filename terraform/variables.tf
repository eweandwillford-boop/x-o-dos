variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "image_name" {
  description = "Docker image to deploy (e.g., gcr.io/project/image:tag)"
  type        = string
}

variable "polygon_rpc_url" {
  description = "RPC URL for Polygon network"
  type        = string
}

variable "contract_address" {
  description = "Address of the deployed smart contract"
  type        = string
}

variable "private_key_initial_value" {
  description = "Initial value for the private key secret (CHANGE IMMEDIATELY IN CONSOLE)"
  type        = string
  sensitive   = true
  default     = "changeme"
}
