# X-O-Dos Platform

Welcome to the **X-O-Dos** monolithic repository. This project implements a decentralized task marketplace with a specific retro "DOS" aesthetic.

## 📂 Project Structure

- **api/**: Node.js/Express API. Also serves the static Frontend files in production.
- **contracts/**: Hardhat project for `XoDos` smart contract.
- **frontend/**: React/TypeScript Trading Platform UI (Vite). Built using multi-stage Docker build.
- **`/contracts`**: Solidity Smart Contracts environment (Hardhat).
    - Contains `XoDos.sol`: The core marketplace logic.
    - Unit tests in `/test`.
    - A complete Trading Platform interface.
    - Connects to MetaMask and Smart Contracts using ethers.js.
- **`/terraform`**: Infrastructure as Code.
    - Defines Google Cloud Run and Secret Manager resources.
- **`.github`**: CI/CD Workflows.
- **`SECURITY.md`**: Detailed security policy and rollout plan.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v20+
- npm

### 1. Install Dependencies
Run from the root directory to install dependencies for all workspaces:
```bash
npm install
```

### 2. Smart Contracts (Local Chain)
Start a local blockchain and deploy the contract:
```bash
cd contracts
npx hardhat node
# In a new terminal:
npx hardhat run scripts/deploy.js --network localhost
```
*Note the deployed contract address.*

### 3. API
Configure the API:
```bash
cd api
cp .env.example .env
# Edit .env: Set CONTRACT_ADDRESS to the one from step 2.
npm start
```

### 4. Frontend
Configure and start the frontend:
```bash
cd frontend
# Ensure environment variables/constants point to the local contract address.
npm run dev
```

## 🛡️ Security & Safeguards

This project enforces strict security measures to preventing accidental or insecure deployments.

### 🛑 Manual Approval Gates
We implement **Human-in-the-Loop** verification for all infrastructure and production code changes:

1.  **Docker Build & Push**:
    - **NO** automatic builds on push to `main`.
    - **Action**: You must manually trigger the `CI` workflow with `workflow_dispatch` input to build and push the Docker image.
    
2.  **Infrastructure Updates (Terraform)**:
    - **Action**: Deployment logic in `terraform/README.md` requires you to run `terraform plan` and **manually review** the output before running `terraform apply`.
    - There is no automated `terraform apply` in CI.

3.  **Smart Contract Security**:
    - **Slither Analysis**: Automatically runs on every PR. Fails the build if high-severity issues are found.

## ✅ Deployment Checklist

Follow this checklist for every release:

- [ ] **Code Review**: Ensure all tests pass (`npm test`) and code is reviewed.
- [ ] **Security Scan**: Verify `analyze` job in GitHub Actions passed (Slither).
- [ ] **Staging Verified**: Validated functionality on Polygon Mumbai.
- [ ] **Audit Cleared (Mainnet Only)**: External audit findings resolved.
- [ ] **Build Image**: Manually trigger `workflow_dispatch` in GitHub Actions to push `xodos-api:latest`.
- [ ] **Infrastructure Plan**:
    - `cd terraform`
    - `terraform plan -out=tfplan`
    - **REVIEW**: Check that only intended resources are changed.
- [ ] **Apply Infrastructure**: `terraform apply tfplan`.
- [ ] **Verification**: Check Cloud Run URL and Frontend connectivity.

---
*For detailed security policies, refer to [SECURITY.md](./SECURITY.md).*
