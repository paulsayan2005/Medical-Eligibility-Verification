import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { FinalizedTxData } from '@midnight-ntwrk/midnight-js-types';
import type { PublicDataProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ZKConfigProvider } from '@midnight-ntwrk/midnight-js-types';
import type { EligibilityPrivateState } from '@midnight-ntwrk/contract';

// ============================================================
// Type aliases for the Medical Eligibility Verification dApp
// ============================================================

export type EligibilityPrivateStateId = string;

export type EligibilityProviders = {
  readonly walletProvider: WalletProvider;
  readonly midnightProvider: MidnightProvider;
  readonly publicDataProvider: PublicDataProvider;
  readonly zkConfigProvider: ZKConfigProvider<string>;
};

// The deployed contract instance type (opaque — holds contract state)
export type DeployedEligibilityContract = {
  readonly deployTxData: {
    readonly public: {
      readonly contractAddress: ContractAddress;
    };
  };
  readonly callTx: (_circuit: string, ..._args: unknown[]) => Promise<FinalizedTxData>;
};

// Public ledger state — all fields are visible to observers
export type EligibilityLedgerState = {
  verificationCount: bigint;
  eligibleCount: bigint;
  ineligibleCount: bigint;
};

export type { EligibilityPrivateState };
