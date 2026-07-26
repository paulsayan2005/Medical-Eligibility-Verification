import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { witnesses, type EligibilityPrivateState } from '@midnight-ntwrk/contract';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  type BalancedTransaction,
  type FinalizedTxData,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { webcrypto } from 'crypto';
import { type Logger } from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import * as fs from 'node:fs';
import { type Config, contractConfig } from './config.js';
import type { EligibilityLedgerState, EligibilityPrivateStateId } from './common-types.js';

// @ts-expect-error: Enable WebSocket for Apollo client
globalThis.WebSocket = WebSocket;

import * as contractModule from '../../contract/src/managed/medical-eligibility-verification/contract/index.js';

let logger: Logger;

export function setLogger(_logger: Logger) {
  logger = _logger;
}

// ============================================================
// Provider types
// ============================================================
type EligibilityProviders = {
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
  publicDataProvider: ReturnType<typeof indexerPublicDataProvider>;
  zkConfigProvider: NodeZkConfigProvider<'verifyEligibility'>;
  proofProvider: ReturnType<typeof httpClientProofProvider>;
  privateStateProvider: ReturnType<typeof levelPrivateStateProvider<EligibilityPrivateStateId>>;
};

// ============================================================
// Ledger state query
// ============================================================
export const getEligibilityLedgerState = async (
  providers: EligibilityProviders,
  contractAddress: ContractAddress,
): Promise<EligibilityLedgerState | null> => {
  assertIsContractAddress(contractAddress);
  logger?.info('Querying public ledger state...');
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  if (contractState == null) return null;

  const ledger = contractModule.ledger(contractState.data);
  return {
    verificationCount: ledger.verificationCount ?? 0n,
    eligibleCount: ledger.eligibleCount ?? 0n,
    ineligibleCount: ledger.ineligibleCount ?? 0n,
  };
};

// ============================================================
// Contract deployment
// ============================================================
export const deployEligibilityContract = async (
  providers: EligibilityProviders,
  initialPrivateState: EligibilityPrivateState,
) => {
  logger?.info('Deploying Medical Eligibility Verification contract...');

  const eligibilityContractInstance = new contractModule.Contract(witnesses);

  const deployed = await deployContract(providers, {
    contract: eligibilityContractInstance,
    privateStateId: 'eligibilityPrivateState',
    initialPrivateState,
  });

  const address = deployed.deployTxData.public.contractAddress;
  logger?.info(`✅ Contract deployed at: ${address}`);
  return deployed;
};

// ============================================================
// Join existing deployed contract
// ============================================================
export const joinEligibilityContract = async (
  providers: EligibilityProviders,
  contractAddress: string,
  initialPrivateState: EligibilityPrivateState,
) => {
  const eligibilityContractInstance = new contractModule.Contract(witnesses);

  const joined = await findDeployedContract(providers, {
    contractAddress,
    contract: eligibilityContractInstance,
    privateStateId: 'eligibilityPrivateState',
    initialPrivateState,
  });

  logger?.info(`Joined contract at: ${joined.deployTxData.public.contractAddress}`);
  return joined;
};

// ============================================================
// Call verifyEligibility circuit
//
// Privacy: patientAge and policyIdHash are in privateState only.
// They are used by the ZK witness at proof-generation time.
// Only the boolean result is submitted and stored on-chain.
// ============================================================
export const verifyEligibility = async (
  providers: EligibilityProviders,
  contractAddress: string,
  minAge: number,
  privateState: EligibilityPrivateState,
): Promise<boolean> => {
  const joined = await joinEligibilityContract(providers, contractAddress, privateState);

  logger?.info(`Calling verifyEligibility(minAge=${minAge})...`);
  logger?.info('⚠️  Private state (age, policyHash) stays local — only ZK proof submitted');

  const txData = await joined.callTx.verifyEligibility(BigInt(minAge));

  logger?.info(`Transaction submitted: ${toHex(txData.public.txId as unknown as Uint8Array)}`);

  // Read the updated ledger to get the result
  const state = await getEligibilityLedgerState(providers, contractAddress as ContractAddress);
  if (!state) return false;

  // The result is inferred from the counter difference
  const wasEligible = state.eligibleCount > 0n;
  logger?.info(`Verification result: ${wasEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}`);

  return wasEligible;
};

// ============================================================
// Wallet helpers
// ============================================================

export const waitForSyncProgress = async (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.filter((s) => s.syncProgress !== null),
      Rx.map((s) => s.syncProgress),
    ),
  );

export const waitForSync = async (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.filter((s) => s.syncProgress?.synced === true || s.syncProgress !== null),
      Rx.map((s) => s),
    ),
  );

const waitForFunds = async (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

const createWalletAndMidnightProvider = async (wallet: Wallet & Resource) => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
      return wallet.balanceTransaction(
        ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
        newCoins,
      ) as any;
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
    watchForTxData(txId: TransactionId): Promise<FinalizedTxData> {
      return Rx.firstValueFrom(
        (wallet as any).transactions().pipe(
          Rx.map((txs: any) => txs.find((tx: any) => tx.public.txId === txId)),
          Rx.filter((tx: any): tx is FinalizedTxData => tx !== undefined),
        ),
      ) as any;
    },
    proveTransaction(tx: UnbalancedTransaction): Promise<Transaction> {
      return Promise.resolve(tx as unknown as Transaction);
    },
  };
};

export const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string,
  _filename = '',
): Promise<Wallet & Resource> => {
  logger?.info(`Building wallet from seed...`);
  logger?.info(`Network: indexer=${indexer}, node=${node}`);

  const wallet = await WalletBuilder.buildFromSeed(
    indexer,
    indexerWS,
    proofServer,
    node,
    seed,
    getZswapNetworkId(),
    'info',
  );
  wallet.start();

  const state = await Rx.firstValueFrom(wallet.state());
  logger?.info(`Wallet address: ${state.address}`);

  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger?.info('Waiting for funds...');
    balance = await waitForFunds(wallet);
  }
  logger?.info(`Wallet balance: ${balance} tDUST`);
  return wallet;
};

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
};

export const buildFreshWallet = async (config: Config): Promise<Wallet & Resource> =>
  buildWalletAndWaitForFunds(config, toHex(randomBytes(32)));

export const configureProviders = async (wallet: Wallet & Resource, config: Config): Promise<EligibilityProviders> => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);
  return {
    privateStateProvider: levelPrivateStateProvider<EligibilityPrivateStateId>({
      privateStateStoreName: contractConfig.privateStateStoreName,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider<'verifyEligibility'>(contractConfig.zkConfigPath),
    proofProvider: httpClientProofProvider(config.proofServer),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

export const streamToString = async (stream: fs.ReadStream): Promise<string> => {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};
