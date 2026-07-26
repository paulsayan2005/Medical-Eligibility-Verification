import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  secretPatientAge(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  secretPolicyIdHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  verifyEligibility(context: __compactRuntime.CircuitContext<PS>,
                    minAge_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  verifyEligibility(context: __compactRuntime.CircuitContext<PS>,
                    minAge_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  verifyEligibility(context: __compactRuntime.CircuitContext<PS>,
                    minAge_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  readonly verificationCount: bigint;
  readonly eligibleCount: bigint;
  readonly ineligibleCount: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
