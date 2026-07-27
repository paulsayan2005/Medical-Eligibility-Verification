# Medical Eligibility Verification (Midnight Auth) — Hackathon Proposal & Technical Specification

## 1. Project Title
**Confidential Medical Eligibility Verification (Midnight Auth)**

## 2. Problem Statement
In modern healthcare systems, patients are frequently required to prove their eligibility for treatments, clinical trials, insurance coverages, or age-restricted medical procedures. Traditionally, verifying eligibility requires patients to submit full, unredacted personal medical records, government identification documents, exact dates of birth, and policy numbers to insurance companies, third-party claim aggregators, or healthcare providers.

This current process poses severe privacy and security risks:
- **Massive Data Over-Exposure**: Verifying a simple binary condition (e.g., "Is patient over 18?" or "Does patient hold a valid policy?") requires exposing sensitive personal health information (PHI).
- **Data Breach Vulnerabilities**: Centralized repositories storing patient health records are high-priority targets for cyberattacks and ransomware.
- **Regulatory & Compliance Burden**: Entities handling PHI must maintain strict HIPAA, GDPR, and local privacy compliance, which is complex and costly.

## 3. Motivation
Privacy should be the default, not an after-thought, in digital healthcare infrastructure. With advances in Zero-Knowledge cryptography and privacy-preserving blockchain architectures like Midnight Network, patients should never have to compromise their personal health privacy just to claim medical benefits or confirm procedure eligibility.

Our motivation is to build a decentralized, privacy-first eligibility protocol where patients can generate tamper-proof Zero-Knowledge proofs of their health attributes locally on their own devices. Healthcare providers and verifiers can confirm eligibility on-chain with 100% cryptographic certainty without ever seeing, storing, or transmitting underlying private health records.

## 4. Proposed Solution
**Midnight Auth** is a confidential medical eligibility verification dApp powered by Compact smart contracts on the Midnight Network.

Key aspects of the solution:
1. **Local ZK Proof Generation**: Patients keep personal attributes (e.g., exact patient age, raw policy secrets) strictly local on their device.
2. **Compact Smart Contract**: A privacy-preserving smart contract defines circuit logic that checks whether `patientAge >= minAge` and verifies policy commitment hashes without revealing the raw values.
3. **Public Ledger Verification Count**: The contract updates public ledger counters (`verificationCount`, `eligibleCount`, `ineligibleCount`) upon successful execution.
4. **Decentralized Credentials**: Patients can store zero-knowledge proof credentials in a local credential vault and present them to verified medical entities.

## 5. Why Midnight Network
Midnight Network is uniquely designed for confidential decentralized applications (dApps) through its hybrid public-private ledger architecture and the **Compact** smart contract language.

- **Selective Disclosure & Private State**: Midnight allows dApps to manage private state on-chain, exposing only what is strictly necessary through ZK circuit definitions.
- **Native Zero-Knowledge Support**: Compact natively compiles private witness logic into zero-knowledge circuits, eliminating the need to hand-code complex zk-SNARK constraints.
- **Dual Ledger Architecture**: Midnight balances public ledger transparency (auditable verification counters) with private state privacy (patient credentials).
- **CIP-30 & Lace DApp Connector**: Seamlessly integrates with browser privacy wallets like Lace Midnight for frictionless identity management.

## 6. Privacy Model
The privacy model enforces strict data minimization:
- **Private Inputs (Local Witness)**: Raw patient age (`patientAge`), policy secret string (`policySecret`), and private state key.
- **Circuit Operations**: Performed entirely off-chain inside the Midnight Proof Engine on the user's device.
- **Public Outputs**: A cryptographic ZK proof and public contract call parameters (`minAge`).
- **On-Chain Impact**: Only the verified ledger counters and public state transition are recorded on Midnight's public ledger.

```
+-----------------------------------------------------------------------------------+
|                              PATIENT DEVICE (LOCAL)                               |
|                                                                                   |
|  [ Patient Age: 25 ]      [ Policy: "POLICY-12345" ]                              |
|           |                           |                                           |
|           +-------------+-------------+                                           |
|                         |                                                         |
|                         v                                                         |
|            (Compact Private Witness)                                              |
|                         |                                                         |
|                         v                                                         |
|               [ Midnight Proof Server ]                                           |
|                         |                                                         |
+-------------------------|---------------------------------------------------------+
                          | (Generates ZK Proof - Zero Leakage)
                          v
+-----------------------------------------------------------------------------------+
|                              MIDNIGHT NETWORK LEDGER                              |
|                                                                                   |
|   [ Public State: verificationCount += 1, eligibleCount += 1 ]                     |
+-----------------------------------------------------------------------------------+
```

## 7. Public Ledger State
The public state of the Compact smart contract consists of audited, aggregate metrics accessible on-chain:
- **`verificationCount`** (`Uint`): Total number of eligibility verifications conducted on the contract.
- **`eligibleCount`** (`Uint`): Aggregate count of verifications resulting in an eligible status.
- **`ineligibleCount`** (`Uint`): Aggregate count of verifications resulting in an ineligible status.

None of the public ledger state variables reveal individual patient identifiers, ages, or policy numbers.

## 8. Private Witness Data
Private witness data is defined within `witnesses.ts` and Compact private circuits. It remains on the local client:
- **`patientAge`** (`Uint<8>`): Patient's numeric age.
- **`policyHash`** (`Bytes<32>`): SHA-256 / poseidon hash commitment of the patient's insurance policy ID.
- **`signingKey`**: Private key used to authenticate local state updates within the `InMemoryPrivateStateProvider`.

## 9. Zero-Knowledge Flow
1. **Patient Input**: Patient enters their age (e.g., `25`) and policy code (e.g., `POLICY-12345`) into the Midnight Auth frontend.
2. **Private State Initialization**: `createEligibilityPrivateState(age, hashPolicyId(policyId))` creates the local private state object.
3. **Circuit Execution**: The Compact runtime passes private witness data into the `verifyEligibility(minAge)` circuit.
4. **Proof Generation**: The Midnight HTTP Proof Provider requests proof construction from the ZK proof engine.
5. **On-Chain Submission**: The resulting transaction (containing public proof + transition data) is submitted to the Midnight network node via Lace / Midnight Wallet API.
6. **State Update**: The ledger validates the proof and increments `verificationCount` and `eligibleCount`.

## 10. Technical Architecture
The application is structured into four main decoupled layers:

1. **Smart Contract Layer (`boilerplate/contract`)**:
   - `medical-eligibility-verification.compact`: Defines public ledger state, private witness functions, and circuit logic.
   - Managed contract JS/TS artifacts and witnesses implementation.
2. **Contract CLI Layer (`boilerplate/contract-cli`)**:
   - Standalone CLI generator and testnet harness for deployment, proof server configuration, and testnet interaction.
3. **Frontend Application Layer (`boilerplate/frontend`)**:
   - React 19 + TypeScript + Vite + Tailwind CSS.
   - Multi-Wallet Connector (`WalletContext`, `WalletPanel`, `WalletModal`) supporting Lace Midnight, CIP-30 wallets, and DevNet Demo mode.
4. **Midnight JS / SDK Layer**:
   - `@midnight-ntwrk/midnight-js-contracts`
   - `@midnight-ntwrk/midnight-js-fetch-zk-config-provider`
   - `@midnight-ntwrk/midnight-js-http-client-proof-provider`
   - `@midnight-ntwrk/midnight-js-indexer-public-data-provider`
   - `@midnight-ntwrk/dapp-connector-api`

## 11. Smart Contract Overview
The Compact contract `MedicalEligibilityVerification` enforces eligibility rules:

```compact
pragma language_version >= 0.14.0;

export ledger verificationCount: Counter;
export ledger eligibleCount: Counter;
export ledger ineligibleCount: Counter;

witness patientAge(): Uint;
witness policyHash(): Bytes<32>;

export circuit verifyEligibility(minAge: Uint): Void {
  const age = patientAge();
  verificationCount.increment(1);
  if (age >= minAge) {
    eligibleCount.increment(1);
  } else {
    ineligibleCount.increment(1);
  }
}
```

## 12. Frontend Overview
The frontend is built for high visual quality, accessibility, and modern dApp user experience:
- **Theme Support**: Dark mode, light mode, and system preference detection via `ThemeContext`.
- **Navigation & Layout**: Clean sidebar navigation (`Dashboard`, `Verify Eligibility`, `Credential Vault`, `History`, `Privacy`, `Settings`).
- **Wallet Connection Modal**: Real-time browser extension detection (`window.midnight`, `window.cardano`), copyable public keys, status badges, and download links.
- **Verification Page**: Interactive form allowing custom age, policy ID, and minimum required age verification with step-by-step ZK proof generation logs.

## 13. User Roles
- **Patient / Applicant**: Generates ZK proofs locally, verifies eligibility without exposing raw health attributes, and stores proof credentials.
- **Healthcare Provider / Verifier**: Deploys or joins an eligibility verification contract, specifies eligibility thresholds (`minAge`), and verifies patient proofs on-chain.
- **Network Auditor**: Inspects aggregate ledger counters (`verificationCount`, `eligibleCount`) on Midnight indexer to audit overall protocol activity.

## 14. Key Features
- **Confidential Verification**: Proves `age >= minAge` without disclosing exact age or birthdate.
- **Multi-Wallet Support**: Seamless connection with Lace (Midnight), CIP-30 Cardano wallets, and built-in DevNet Demo Wallet.
- **Local Private State Provider**: Private state never leaves browser local storage / memory.
- **Credential Vault**: Persistent view of generated proof credentials and verification history.
- **Real-Time Indexer Queries**: Queries public ledger state dynamically from Midnight indexer endpoint.

## 15. Security Considerations
- **No Remote PHI Storage**: Raw health metrics are never sent to external servers or indexers.
- **Replay Protection**: Contract interactions use unique transaction hashes and ledger state transitions.
- **Input Sanitization & Constraints**: Frontend and Compact circuits enforce valid range constraints (e.g. `0 <= age <= 255`).
- **Cryptographic Hashing**: Policy IDs are hashed using standard cryptographic hash functions prior to private state initialization.

## 16. Future Improvements
- **Multi-Factor Health Attributes**: Support multi-variable proofs (e.g. age + blood type + coverage status + location).
- **Verifiable Credentials (W3C VC/VP)**: Export ZK proofs as W3C-compliant Verifiable Presentations for offline verification.
- **Decentralized Identifier (DID) Integration**: Bind patient identities to Midnight DIDs.
- **Oracle Integration**: Securely import verified electronic health records (EHR) via trusted Midnight privacy oracles.

## 17. Midnight Level 3 Category
This project belongs to **Midnight Level 3: Advanced Confidential DApps & Identity Protocols**, combining private witness state management, Compact ZK circuits, and browser extension wallet integration.

## 18. Deployment Architecture
- **Contract Language**: Compact (Midnight Network)
- **Target Network**: Midnight Testnet / Preprod (`testnet-02.midnight.network`)
- **Indexer Endpoint**: `https://indexer.testnet-02.midnight.network/api/v1/graphql`
- **RPC Endpoint**: `https://rpc.testnet-02.midnight.network`
- **Proof Server Endpoint**: Local / Remote HTTP Proof Server (`http://127.0.0.1:6300`)

## 19. Screenshots Placeholder
- `docs/screenshots/landing.png` - Landing Page & Protocol Overview
- `docs/screenshots/privacy.png` - Privacy Model & Architecture Diagram
- `docs/screenshots/settings.png` - Settings & Network Configuration
- `docs/screenshots/history.png` - Verification History & Audit Log

## 20. Demo Instructions
1. **Clone Repository**:
   ```bash
   git clone https://github.com/paulsayan2005/Medical-Eligibility-Verification.git
   cd Medical-Eligibility-Verification
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Frontend Application**:
   ```bash
   cd boilerplate/frontend
   npm run dev
   ```
4. **Connect Wallet & Test**:
   - Open browser at `http://localhost:5173`.
   - Click **Connect Wallet** in top navbar.
   - Select **Lace (Midnight)** or **Midnight DevNet Demo Wallet**.
   - Navigate to **Verify Eligibility**, enter sample inputs (Age: `25`, Policy: `POLICY-12345`, Min Age: `18`), and click **Deploy Contract** / **Generate ZK Proof**.
