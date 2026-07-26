# Medical Eligibility Verification (Midnight Network dApp)

This project is a full-stack Midnight Network decentralized application that implements **Confidential Credentials** for Medical Eligibility Verification.

It allows a patient to prove they meet a minimum age requirement and hold a valid policy ID **without** revealing their actual age or policy ID on the public ledger, utilizing Zero-Knowledge proofs.

## Project Structure

- `boilerplate/contract`: The Compact smart contract logic and witnesses.
- `boilerplate/contract-cli`: Interactive Node.js CLI tool for testing deployment and verification.
- `boilerplate/frontend`: A Vite + React + TS frontend integrating with the Lace wallet to interact with the contract.

## Prerequisites

- **WSL (Ubuntu)** is highly recommended on Windows for Midnight development to avoid filesystem permission issues with the Compact compiler.
- Node.js 22+
- Midnight Compact Compiler (`0.31.1`) installed in `~/.compact/versions/0.31.1/x86_64-unknown-linux-musl/compactc.bin`

## Setup & Compilation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Compile the Contract**:
   This compiles the `.compact` file to a ZK circuit and generates the TypeScript bindings.
   ```bash
   npm run build -w boilerplate/contract
   ```

## Running the Tests & CLI

The CLI contains a full interactive flow to Deploy, Join, Verify, and Query the ledger state. It also contains Vitest tests.

```bash
npm run test -w boilerplate/contract-cli
```

To run the interactive CLI:
```bash
npm start -w boilerplate/contract-cli
```

## Running the Frontend

The React frontend uses the `dapp-connector-api` to connect to the Lace wallet extension.

```bash
cd boilerplate/frontend
npm run dev
```

Open your browser to the local Vite URL. Connect your Lace wallet, deploy a new Eligibility contract, or join an existing one to perform Zero-Knowledge verifications.

## Architecture & Privacy Model

- **Public Ledger State**: `verificationCount`, `eligibleCount`, `ineligibleCount`.
- **Private State (Witnesses)**: `secretPatientAge`, `secretPolicyIdHash`.

When a patient verifies eligibility, a Zero-Knowledge proof is generated locally in the browser/CLI, proving `age >= minAge` and `policyHash != emptyHash`. Only the boolean outcome is disclosed to the public network, incrementing the public counters.

## Known Limitations / Notes

- **Dynamic Imports in Tests**: Node/Vitest has issues with dynamic module resolution for generated contract JS bundles. Static imports and a `sed` patch removing `checkRuntimeVersion` are implemented in the build step to ensure tests run smoothly.
- **Vite Build**: The Vite build requires `vite-plugin-top-level-await` and `vite-plugin-wasm` to handle the `@midnight-ntwrk/onchain-runtime` WebAssembly.
