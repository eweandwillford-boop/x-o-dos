# X-O-Dos Terraform Infrastructure

This directory contains Terraform configuration to provision Google Cloud resources for the X-O-Dos API.

## Resources Created

- **Cloud Run Service**: Hosting the API container.
- **Secret Manager**: Storing the wallet `PRIVATE_KEY` securely.
- **IAM Policy**: Allowing public access to the API endpoint.

## Prerequisites

- [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) installed.
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth application-default login`).
- A Google Cloud Project created.

## Usage

1.  **Initialize Terraform**:
    ```bash
    terraform init
    ```

2.  **Create a `terraform.tfvars` file** (DO NOT COMMIT THIS FILE):
    ```hcl
    project_id       = "your-gcp-project-id"
    region           = "us-central1"
    image_name       = "your-dockerhub-username/xodos-api:latest" # Or GCR/GAR path
    polygon_rpc_url  = "https://rpc-mumbai.maticvigil.com"
    contract_address = "0xYourContractAddress"
    private_key_initial_value = "0xYourPrivateKey"
    ```

3.  **Plan the Deployment**:
    ```bash
    terraform plan -out=tfplan
    ```
    > **⚠️ IMPORTANT: MANUAL APPROVAL REQUIRED**
    > 
    > Carefully review the output of `terraform plan`. Ensure that:
    > - The correct Project ID and Region are targeted.
    > - The Secret values are handled correctly.
    > - No unexpected resources are being destroyed.

4.  **Apply the Configuration**:
    Only proceed if the plan looks correct.
    ```bash
    terraform apply tfplan
    ```

5.  **Post-Deployment**:
    - If you used a dummy value for `private_key_initial_value`, go to the [Google Cloud Console > Secret Manager](https://console.cloud.google.com/security/secret-manager) and add a new version with the real private key, then update the Cloud Run service to use the latest version if needed (Terraform configures it to use `latest`, so a restart might be required).
