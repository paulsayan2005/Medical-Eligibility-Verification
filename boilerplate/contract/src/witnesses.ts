import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "./managed/medical-eligibility-verification/contract/index.js";

// ============================================================
// EligibilityPrivateState
//
// This is the LOCAL private state held only by the patient/prover.
// It is NEVER sent on-chain or shared with any observer.
//
// Privacy guarantee:
//   - patientAge : the patient's real age (0-255)
//   - policyIdHash : 32-byte SHA-256 hash of their policy ID
//
// These values feed the ZK witness functions at proof-generation time.
// ============================================================
export type EligibilityPrivateState = {
  readonly patientAge: number; // Uint<8> — patient's real age
  readonly policyIdHash: Uint8Array; // Bytes<32> — hash of policy ID
};

export const createEligibilityPrivateState = (
  patientAge: number,
  policyIdHash: Uint8Array
): EligibilityPrivateState => ({
  patientAge: Math.max(0, Math.min(255, Math.floor(patientAge))),
  policyIdHash:
    policyIdHash.length === 32 ? policyIdHash : padTo32(policyIdHash)
});

/**
 * Pad or truncate a Uint8Array to exactly 32 bytes (right-pad with zeros).
 */
export const padTo32 = (input: Uint8Array): Uint8Array => {
  const out = new Uint8Array(32);
  out.set(input.slice(0, 32));
  return out;
};

/**
 * Hash a policy ID string into a 32-byte Uint8Array using a simple
 * deterministic encoding. In production this should be SHA-256.
 */
export const hashPolicyId = (policyId: string): Uint8Array => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(policyId);
  const out = new Uint8Array(32);
  // XOR-fold the bytes into 32 slots (deterministic, suitable for demo)
  for (let i = 0; i < bytes.length; i++) {
    out[i % 32] ^= bytes[i];
  }
  return out;
};

// ============================================================
// Witness implementations — called by the ZK proof system
//
// The witness functions receive the WitnessContext containing
// the local private state and return the private values needed
// by the circuit. These are computed client-side only.
// ============================================================
export const witnesses = {
  /**
   * secretPatientAge witness
   * Returns the patient's age as a Uint<8> for use in the ZK proof.
   * This value is NEVER disclosed on-chain.
   */
  secretPatientAge: ({
    privateState
  }: WitnessContext<Ledger, EligibilityPrivateState>): [
    EligibilityPrivateState,
    bigint
  ] => {
    return [privateState, BigInt(privateState.patientAge)];
  },

  /**
   * secretPolicyIdHash witness
   * Returns the 32-byte policy ID hash for use in the ZK proof.
   * This value is NEVER disclosed on-chain.
   */
  secretPolicyIdHash: ({
    privateState
  }: WitnessContext<Ledger, EligibilityPrivateState>): [
    EligibilityPrivateState,
    Uint8Array
  ] => {
    return [privateState, privateState.policyIdHash];
  }
};
