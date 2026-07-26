import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import wasm from 'vite-plugin-wasm'

/**
 * Vite plugin that intercepts @midnight-ntwrk/compact-runtime imports and
 * returns a virtual ESM module. This bypasses the CJS runtime.js which cannot
 * be bundled because it does require('@midnight-ntwrk/onchain-runtime') — a
 * synchronous CJS require of an ESM WASM module (incompatible with Rolldown's
 * [REQUIRE_TLA] constraint).
 *
 * Instead we build a synthetic ESM that:
 *  1. Imports everything from onchain-runtime (WASM handled by vite-plugin-wasm)
 *  2. Provides the Compact type classes that runtime.js adds on top
 */
function compactRuntimeEsmPlugin() {
  const VIRTUAL_ID = '\0virtual:compact-runtime'
  const RUNTIME_PATH_FRAGMENT = '@midnight-ntwrk/compact-runtime'
  return {
    name: 'compact-runtime-esm',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === RUNTIME_PATH_FRAGMENT || id.includes(RUNTIME_PATH_FRAGMENT)) {
        return VIRTUAL_ID
      }
    },
    load(id: string) {
      if (id === VIRTUAL_ID) {
        return `
// Virtual ESM shim for @midnight-ntwrk/compact-runtime
export * from '@midnight-ntwrk/onchain-runtime';
import {
  encodeCoinPublicKey, decodeCoinPublicKey, encodeContractAddress, decodeContractAddress,
  encodeCoinInfo, decodeCoinInfo, encodeQualifiedCoinInfo, decodeQualifiedCoinInfo,
  checkProofData as _checkProofData, valueToBigInt, bigIntToValue,
  QueryContext, CostModel,
} from '@midnight-ntwrk/onchain-runtime';

export function checkRuntimeVersion() { return true; }
export const COMPACT_RUNTIME_VERSION = '0.8.1';

export class CompactError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'CompactError';
  }
}

export class CompactTypeField {
  alignment() { return [{ tag: 'atom', value: { tag: 'field' } }]; }
  fromValue(value) {
    const val = value.shift();
    if (val == undefined) throw new CompactError('expected Field');
    return valueToBigInt([val]);
  }
  toValue(value) { return bigIntToValue(value); }
}

export class CompactTypeEnum {
  constructor(maxValue, length) {
    this.maxValue = maxValue;
    this.length = length;
  }
  alignment() { return [{ tag: 'atom', value: { tag: 'bytes', length: this.length } }]; }
  fromValue(value) {
    const val = value.shift();
    if (val == undefined) throw new CompactError(\`expected Enum[<=\${this.maxValue}]\`);
    let res = 0;
    for (let i = 0; i < val.length; i++) res += (1 << (8 * i)) * val[i];
    if (res > this.maxValue) throw new CompactError(\`expected UnsignedInteger[<=\${this.maxValue}]\`);
    return res;
  }
  toValue(value) { return new CompactTypeField().toValue(BigInt(value)); }
}

export class CompactTypeUnsignedInteger {
  constructor(maxValue, length) {
    this.maxValue = maxValue;
    this.length = length;
  }
  alignment() { return [{ tag: 'atom', value: { tag: 'bytes', length: this.length } }]; }
  fromValue(value) {
    const val = value.shift();
    if (val == undefined) throw new CompactError(\`expected UnsignedInteger[<=\${this.maxValue}]\`);
    let res = 0n;
    for (let i = 0; i < val.length; i++) res += (1n << (8n * BigInt(i))) * BigInt(val[i]);
    if (res > this.maxValue) throw new CompactError(\`expected UnsignedInteger[<=\${this.maxValue}]\`);
    return res;
  }
  toValue(value) { return new CompactTypeField().toValue(value); }
}

export class CompactTypeVector {
  constructor(length, type) {
    this.length = length;
    this.type = type;
  }
  alignment() {
    const inner = this.type.alignment();
    let res = [];
    for (let i = 0; i < this.length; i++) res = res.concat(inner);
    return res;
  }
  fromValue(value) {
    const res = [];
    for (let i = 0; i < this.length; i++) res.push(this.type.fromValue(value));
    return res;
  }
  toValue(value) {
    if (value.length != this.length) throw new CompactError(\`expected \${this.length}-element array\`);
    let res = [];
    for (let i = 0; i < this.length; i++) res = res.concat(this.type.toValue(value[i]));
    return res;
  }
}

export class CompactTypeBoolean {
  alignment() { return [{ tag: 'atom', value: { tag: 'bytes', length: 1 } }]; }
  fromValue(value) {
    const val = value.shift();
    if (val == undefined || val.length > 1 || (val.length == 1 && val[0] != 1)) {
      throw new CompactError('expected Boolean');
    }
    return val.length == 1;
  }
  toValue(value) {
    return value ? [new Uint8Array([1])] : [new Uint8Array(0)];
  }
}

export class CompactTypeBytes {
  constructor(length) {
    this.length = length;
  }
  alignment() { return [{ tag: 'atom', value: { tag: 'bytes', length: this.length } }]; }
  fromValue(value) {
    const val = value.shift();
    if (val == undefined || val.length > this.length) {
      throw new CompactError(\`expected Bytes[\${this.length}]\`);
    }
    if (val.length == this.length) return val;
    const res = new Uint8Array(this.length);
    res.set(val, 0);
    return res;
  }
  toValue(value) {
    let end = value.length;
    while (end > 0 && value[end - 1] == 0) end -= 1;
    return [value.slice(0, end)];
  }
}

export class CompactTypeOpaqueUint8Array {
  alignment() { return [{ tag: 'atom', value: { tag: 'compress' } }]; }
  fromValue(value) { return value.shift(); }
  toValue(value) { return [value]; }
}

export class CompactTypeOpaqueString {
  alignment() { return [{ tag: 'atom', value: { tag: 'compress' } }]; }
  fromValue(value) { return new TextDecoder('utf-8').decode(value.shift()); }
  toValue(value) { return [new TextEncoder().encode(value)]; }
}

export class CompactTypeCurvePoint {
  alignment() {
    return [
      { tag: 'atom', value: { tag: 'field' } },
      { tag: 'atom', value: { tag: 'field' } },
    ];
  }
  fromValue(value) {
    const x = value.shift();
    const y = value.shift();
    if (x == undefined || y == undefined) throw new CompactError('expected CurvePoint');
    return { x: valueToBigInt([x]), y: valueToBigInt([y]) };
  }
  toValue(value) {
    return bigIntToValue(value.x).concat(bigIntToValue(value.y));
  }
}

export class CompactTypeMerkleTreeDigest {
  alignment() { return [{ tag: 'atom', value: { tag: 'field' } }]; }
  fromValue(value) {
    const val = value.shift();
    if (val == undefined) throw new CompactError('expected MerkleTreeDigest');
    return { field: valueToBigInt([val]) };
  }
  toValue(value) { return bigIntToValue(value.field); }
}

export class CompactTypeMerkleTreePathEntry {
  constructor() {
    this.digest = new CompactTypeMerkleTreeDigest();
    this.bool = new CompactTypeBoolean();
  }
  alignment() { return this.digest.alignment().concat(this.bool.alignment()); }
  fromValue(value) {
    return { sibling: this.digest.fromValue(value), goes_left: this.bool.fromValue(value) };
  }
  toValue(value) {
    return this.digest.toValue(value.sibling).concat(this.bool.toValue(value.goes_left));
  }
}

export class CompactTypeMerkleTreePath {
  constructor(n, leaf) {
    this.leaf = leaf;
    this.path = new CompactTypeVector(n, new CompactTypeMerkleTreePathEntry());
  }
  alignment() { return this.leaf.alignment().concat(this.path.alignment()); }
  fromValue(value) {
    return { leaf: this.leaf.fromValue(value), path: this.path.fromValue(value) };
  }
  toValue(value) {
    return this.leaf.toValue(value.leaf).concat(this.path.toValue(value.path));
  }
}

export const emptyZswapLocalState = (coinPublicKey) => ({
  coinPublicKey: { bytes: encodeCoinPublicKey(coinPublicKey) },
  currentIndex: 0n,
  inputs: [],
  outputs: [],
});

export const encodeRecipient = ({ is_left, left, right }) => ({
  is_left,
  left: { bytes: encodeCoinPublicKey(left) },
  right: { bytes: encodeContractAddress(right) },
});

export const decodeRecipient = ({ is_left, left, right }) => ({
  is_left,
  left: decodeCoinPublicKey(left.bytes),
  right: decodeContractAddress(right.bytes),
});

export const encodeZswapLocalState = (state) => ({
  coinPublicKey: { bytes: encodeCoinPublicKey(state.coinPublicKey) },
  currentIndex: state.currentIndex,
  inputs: state.inputs.map(encodeQualifiedCoinInfo),
  outputs: state.outputs.map(({ coinInfo, recipient }) => ({
    coinInfo: encodeCoinInfo(coinInfo),
    recipient: encodeRecipient(recipient),
  })),
});

export const decodeZswapLocalState = (state) => ({
  coinPublicKey: decodeCoinPublicKey(state.coinPublicKey.bytes),
  currentIndex: state.currentIndex,
  inputs: state.inputs.map(decodeQualifiedCoinInfo),
  outputs: state.outputs.map(({ coinInfo, recipient }) => ({
    coinInfo: decodeCoinInfo(coinInfo),
    recipient: decodeRecipient(recipient),
  })),
});

export const constructorContext = (initialPrivateState, coinPublicKey) => ({
  initialPrivateState,
  initialZswapLocalState: emptyZswapLocalState(coinPublicKey),
});

export function witnessContext(ledger, privateState, contractAddress) {
  return { ledger, privateState, contractAddress };
}

export function checkProofData(zkir, proofData) {
  return _checkProofData(zkir, proofData.input, proofData.output, proofData.publicTranscript, proofData.privateTranscriptOutputs);
}

export function typeError(who, what, where, type, x) {
  throw new CompactError('type error: ' + who + ' ' + what + ' at ' + where + '; expected value of type ' + type + ' but received ' + JSON.stringify(x));
}

export function emptyRunningCost() {
  return { gas: 0n };
}

export class ChargedState {
  constructor(stateValue) {
    this.state = stateValue;
  }
}

export function createCircuitContext(contractAddress, coinPublicKey, chargedStateOrData, privateState) {
  const stateValue = chargedStateOrData instanceof ChargedState ? chargedStateOrData.state : chargedStateOrData;
  return {
    currentQueryContext: new QueryContext(chargedStateOrData, contractAddress),
    currentPrivateState: privateState,
    currentZswapLocalState: emptyZswapLocalState(coinPublicKey),
    gasCost: emptyRunningCost(),
    costModel: CostModel.initialCostModel(),
  };
}

export function createWitnessContext(ledger, privateState, contractAddress) {
  return { ledger, privateState, contractAddress };
}

export function queryLedgerState(context, partialProofData, ops) {
  return context.currentQueryContext.query(ops, partialProofData);
}
`
      }
    },
  }
}

export default defineConfig({
  plugins: [
    wasm(),
    compactRuntimeEsmPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      '@midnight-ntwrk/contract': path.resolve(__dirname, '../contract/src/index.ts'),
    },
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/onchain-runtime',
    ],
  },
})



