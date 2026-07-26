/**
 * Medical Eligibility Verification — Contract & Privacy Tests
 *
 * These tests cover:
 * 1. Compiled contract artifacts exist (managed directory)
 * 2. Config resolves correct zkConfigPath pointing to contract
 * 3. Private state type shape (no accidental public fields)
 * 4. hashPolicyId produces consistent 32-byte hashes
 * 5. createEligibilityPrivateState clamps age to Uint<8> range
 * 6. Zero policy hash is treated as invalid (no-policy case)
 * 7. Non-zero policy hash is treated as valid
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEligibilityPrivateState, hashPolicyId, padTo32 } from '@midnight-ntwrk/contract';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Test 1: Compiled contract artifacts exist
// ============================================================
describe('Contract compilation artifacts', () => {
  it('managed directory exists after compile', () => {
    const contractSrcDir = path.resolve(__dirname, '..', '..', '..', 'contract', 'src');
    const managedDir = path.join(contractSrcDir, 'managed');
    expect(fs.existsSync(managedDir), `managed/ directory should exist at ${managedDir} — run: npm run compile`).toBe(
      true,
    );
  });

  it('medical-eligibility-verification managed subdirectory exists', () => {
    const contractSrcDir = path.resolve(__dirname, '..', '..', '..', 'contract', 'src');
    const managedDir = path.join(contractSrcDir, 'managed', 'medical-eligibility-verification');
    expect(
      fs.existsSync(managedDir),
      `managed/medical-eligibility-verification/ should exist — run: npm run compile`,
    ).toBe(true);
  });

  it('compiled contract JS module exists', () => {
    const contractSrcDir = path.resolve(__dirname, '..', '..', '..', 'contract', 'src');
    const contractJs = path.join(contractSrcDir, 'managed', 'medical-eligibility-verification', 'contract', 'index.js');
    expect(fs.existsSync(contractJs), `Contract JS should exist at ${contractJs}`).toBe(true);
  });
});

// ============================================================
// Test 2: Config points to correct contract path
// ============================================================
describe('Contract config', () => {
  it('contractConfig zkConfigPath points to medical-eligibility-verification', async () => {
    const { contractConfig } = await import('../config.js');
    expect(contractConfig.zkConfigPath).toContain('medical-eligibility-verification');
  });

  it('contractConfig uses eligibility-specific private state store name', async () => {
    const { contractConfig } = await import('../config.js');
    expect(contractConfig.privateStateStoreName).toBe('eligibility-private-state');
  });
});

// ============================================================
// Test 3: Private state structure (privacy model validation)
// ============================================================
describe('EligibilityPrivateState privacy model', () => {
  it('private state only contains age and policyIdHash — no public fields', () => {
    const state = createEligibilityPrivateState(25, hashPolicyId('POLICY-001'));
    const keys = Object.keys(state);
    // Only these two fields should be present
    expect(keys).toContain('patientAge');
    expect(keys).toContain('policyIdHash');
    // Must NOT contain any field that sounds public
    expect(keys).not.toContain('result');
    expect(keys).not.toContain('verificationCount');
    expect(keys).not.toContain('eligible');
  });

  it('private state fields are readonly (privacy enforcement)', () => {
    const state = createEligibilityPrivateState(30, hashPolicyId('POLICY-002'));
    // TypeScript readonly is compile-time, but we verify the values are set correctly
    expect(state.patientAge).toBe(30);
    expect(state.policyIdHash).toHaveLength(32);
  });
});

// ============================================================
// Test 4: hashPolicyId produces consistent 32-byte hashes
// ============================================================
describe('hashPolicyId', () => {
  it('produces exactly 32 bytes', () => {
    const hash = hashPolicyId('BCBS-12345-XYZ');
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash).toHaveLength(32);
  });

  it('is deterministic — same input same output', () => {
    const hash1 = hashPolicyId('AETNA-99887');
    const hash2 = hashPolicyId('AETNA-99887');
    expect(hash1).toEqual(hash2);
  });

  it('different policy IDs produce different hashes', () => {
    const hash1 = hashPolicyId('POLICY-A');
    const hash2 = hashPolicyId('POLICY-B');
    expect(hash1).not.toEqual(hash2);
  });

  it('empty string produces all-zero hash (invalid policy sentinel)', () => {
    const hash = hashPolicyId('');
    const zeros = new Uint8Array(32);
    expect(hash).toEqual(zeros);
  });
});

// ============================================================
// Test 5: createEligibilityPrivateState clamps age to Uint<8>
// ============================================================
describe('createEligibilityPrivateState', () => {
  it('accepts age in valid range 0-255', () => {
    const state = createEligibilityPrivateState(18, hashPolicyId('P-001'));
    expect(state.patientAge).toBe(18);
  });

  it('clamps age above 255 to 255', () => {
    const state = createEligibilityPrivateState(300, hashPolicyId('P-002'));
    expect(state.patientAge).toBe(255);
  });

  it('clamps negative age to 0', () => {
    const state = createEligibilityPrivateState(-5, hashPolicyId('P-003'));
    expect(state.patientAge).toBe(0);
  });

  it('accepts Uint8Array of exactly 32 bytes unchanged', () => {
    const exactHash = new Uint8Array(32).fill(0xab);
    const state = createEligibilityPrivateState(25, exactHash);
    expect(state.policyIdHash).toEqual(exactHash);
  });
});

// ============================================================
// Test 6: padTo32 utility
// ============================================================
describe('padTo32', () => {
  it('pads short arrays to 32 bytes', () => {
    const input = new Uint8Array([1, 2, 3]);
    const result = padTo32(input);
    expect(result).toHaveLength(32);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
    expect(result[2]).toBe(3);
    expect(result[3]).toBe(0);
  });

  it('truncates arrays longer than 32 bytes', () => {
    const input = new Uint8Array(40).fill(0xff);
    const result = padTo32(input);
    expect(result).toHaveLength(32);
    expect(result[31]).toBe(0xff);
  });

  it('leaves 32-byte arrays unchanged', () => {
    const input = new Uint8Array(32).fill(0x42);
    const result = padTo32(input);
    expect(result).toEqual(input);
  });
});

// ============================================================
// Test 7: Eligibility logic (unit-level simulation)
// Simulates the circuit logic without ZK proof
// ============================================================
describe('Eligibility logic simulation', () => {
  const simulateEligibility = (age: number, policyId: string, minAge: number): boolean => {
    const isOldEnough = age >= minAge;
    const policyHash = hashPolicyId(policyId);
    const emptyHash = new Uint8Array(32);
    const hasValidPolicy = !policyHash.every((b, i) => b === emptyHash[i]);
    return isOldEnough && hasValidPolicy;
  };

  it('eligible: age >= minAge and valid policy', () => {
    expect(simulateEligibility(25, 'POLICY-XYZ', 18)).toBe(true);
  });

  it('not eligible: age < minAge', () => {
    expect(simulateEligibility(15, 'POLICY-XYZ', 18)).toBe(false);
  });

  it('not eligible: empty policy ID (zero hash)', () => {
    expect(simulateEligibility(25, '', 18)).toBe(false);
  });

  it('eligible: exact minimum age boundary', () => {
    expect(simulateEligibility(18, 'POLICY-ABC', 18)).toBe(true);
  });

  it('not eligible: one year under minimum age', () => {
    expect(simulateEligibility(17, 'POLICY-ABC', 18)).toBe(false);
  });
});
