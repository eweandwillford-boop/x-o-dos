# Security Policy & Rollout Plan

## Security Measures

### 1. Smart Contract Analysis
We use **Slither** through GitHub Actions to perform static analysis on all smart contracts.
- **Trigger**: Every Pull Request and Push to main.
- **Action**: Fails the build if high-severity vulnerabilities are detected.
- **Location**: `.github/workflows/ci.yml` (`analyze` job).

### 2. Secrets Management
Sensitive information (Private Keys, API Keys) is **NEVER** stored in the repository.
- **Development**: `.env` files (gitignored).
- **Production**: Google Secret Manager (`google_secret_manager_secret`).
- **CI/CD**: GitHub Repository Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).

### 4. External Audit
- **Requirement**: Before any Mainnet deployment, the smart contracts MUST undergo an external security audit by a reputable firm.
- **Process**:
    1.  Deploy to Testnet (Mumbai) for staging.
    2.  Freeze contract code.
    3.  Engage auditors.
    4.  Remediate all High/Medium findings.

---

## Rollout Plan

This guide outlines the safe procedure for deploying updates to the X-O-Dos platform.

### Phase 1: Development & Testing
1.  **Local Development**: Developers write code and run local tests (`npm test`).
2.  **Pull Request**:
    - Push branch to GitHub.
    - **CI Checks**:
        - Unit Tests run automatically.
        - Slither Analysis scans for contract vulnerabilities.
    - **Code Review**: Peer review required before merging.

### Phase 2: Staging (Polygon Mumbai)
1.  **Deploy Contract**: Run `npm run deploy:mumbai` in `contracts/`.
2.  **Verify**: Verify source code on PolygonScan.
3.  **App deployment**: Deploy API and Frontend connected to the Mumbai contract address.

### Phase 3: External Audit
- **Gate**: Proceed to Mainnet ONLY after Audit Report is received and issues fixed.

### Phase 4: Build (Pre-Production)
1.  **Merge to Main**: Code is merged after passing CI and Review.
2.  **Manual Build Trigger**:
    - Go to [GitHub Actions > CI](https://github.com/your-repo/actions).
    - Select the "CI" workflow.
    - Click **"Run workflow"** (Trigger: `workflow_dispatch`).
    - This triggers the `build-push` job to build the API Docker image and push it to Docker Hub.

### Phase 3: Production Deployment
1.  **Infrastructure Plan**:
    - Navigate to `terraform/` locally.
    - Run `terraform init` (if needed).
    - Run `terraform plan -out=tfplan`.
    - **CRITICAL**: Review the plan output. Verify:
        - Contract Addresses are correct.
        - Docker Image tag matches the one just built.
        - No unexpected deletions.
2.  **Apply Configuration**:
    - If the plan is approved, run:
      ```bash
      terraform apply tfplan
      ```
3.  **Verification**:
    - Check Cloud Run console for service health.
    - Verify public endpoint responds correctly.

### Emergency Rollback
- Revert the changes in `terraform/main.tf` to name the previous Docker image tag.
- Run `terraform apply` to re-deploy the known good image.
