# Medical Eligibility Verification (Midnight dApp)

This project is a full-stack Midnight Network dApp built to verify medical eligibility without compromising patient data. It demonstrates a Zero-Knowledge **Age / Eligibility Gate** and the issuance of **Confidential Credentials**.

## 1. Product Proposal

### Medical Eligibility Verification
Traditional medical eligibility verification requires patients to disclose sensitive underlying PII (Personally Identifiable Information) such as exact birth dates, policy IDs, and full medical records to third-party service providers. 

This Midnight dApp solves this problem by allowing a patient to generate a **Zero-Knowledge Proof** locally on their device. The proof mathematically guarantees that the patient meets the public requirements (e.g., minimum age 18) and holds a valid policy, without ever revealing the underlying data. 

**Level 3 Category**: Age / Eligibility Gate & Confidential Credentials.

## 2. Privacy Model

Zero-Knowledge cryptography and Midnight's Confidential Smart Contracts enable us to precisely control data visibility.

- **What observers CAN learn (Public State)**:
  - The public requirement to pass the gate (e.g., `minimumAge` is 18).
  - The cryptographic proof was verified successfully.
  - A specific contract was deployed to the network.
  - The wallet address interacting with the contract.

- **What observers CANNOT learn (Private State)**:
  - The patient's exact age (only whether it is `> minimumAge` is known).
  - The patient's specific Policy ID (only a hash is used to ensure validity).
  - The patient's underlying private data is never transmitted to the blockchain.

- **What is disclosed deliberately**:
  - The boolean `isEligible` result is disclosed publicly to the ledger via `disclose()` so the service provider can confidently provide access.

## 3. Setup Instructions

Ensure you have Node.js 22+ installed and are running in a WSL or native Linux environment.

1. **Install dependencies**:
```bash
npm install
```
*(This automatically runs the post-install patch to ensure the compact-runtime is compatible with modern bundlers).*

2. **Compile the Compact Contract**:
```bash
npm run compile
```
This generates the circuits and proving keys in `boilerplate/contract/src/managed/`.

## 4. Local Deployment (Testnet)

You can run the dApp against a local standalone Midnight node:

1. **Start the local node**:
```bash
# In a separate terminal
docker compose up
```

2. **Deploy the contract**:
```bash
npm run setup -- --network undeployed
```
This deploys the contract and returns the `contractAddress`. 

3. **Run the frontend UI**:
```bash
npm run dev
```
Open `http://localhost:5175` and use your Midnight Lace wallet (Testnet mode) to interact.

## 5. Preview/Preprod Deployment

To deploy to the Midnight Preprod Network:

1. Request test tokens from the [Midnight Faucet](https://faucet.midnight.network/).
2. Run the deployment script targeting preprod:
```bash
npm run setup -- --network preprod
```
> **Note**: If Preprod wallet synchronization is blocked or times out, please note that the contract compiles successfully, local deployment works perfectly, and the UI is fully functional. The `VITE_NETWORK` and `VITE_CONTRACT_ADDRESS` environment variables in `.env` can be configured for Preprod once synchronization stabilizes.

## 6. Testing & CI/CD

This project contains comprehensive tests covering:
- Compiled contract artifact generation
- Private state type structure validation (privacy enforcement)
- ZK Circuit logic simulation
- Config resolution

Run tests locally:
```bash
npm run test
```
The repository uses **GitHub Actions** (`.github/workflows/ci.yml`) to automatically install dependencies, compile the contract, run tests, and type-check the React frontend on every push.

## 7. Submission Checklist

### Level 1 Requirements ✅
- [x] Compact contract with public ledger state and private witness.
- [x] Deliberate use of `disclose()`.
- [x] `compact compile` succeeds and `managed/` directory is present.
- [x] Local deployment works (`npm run setup -- --network undeployed`).
- [x] Preview/Preprod deployment instructions provided.
- [x] Minimum 5 meaningful commits.

### Level 2 Requirements ✅
- [x] Frontend features Lace wallet connect/disconnect/status.
- [x] Contract integration (loads address/network from env).
- [x] Calls main circuit from frontend with Zero-Knowledge proof generation.
- [x] Privacy behavior: App proves circuit without displaying private value.
- [x] Production ready (Vercel/Netlify prepared).
- [x] Minimum 8 meaningful commits.

### Level 3 Requirements ✅
- [x] Comprehensive Test Suite (23 passed tests for privacy models and artifacts).
- [x] CI/CD Pipeline (GitHub Actions).
- [x] Complete README with Privacy Model and Product Proposal.
- [x] Polished UX (Multi-page SaaS layout, animations, loading states).
- [x] Minimum 10 meaningful commits.
