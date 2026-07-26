import path from 'node:path';
import fs from 'node:fs';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

/**
 * Auto-detect the contract path from the .compact source file.
 * This ensures we always reference the current compiled contract.
 */
function detectContractPath(): string {
  const contractSourceDir = path.resolve(currentDir, '..', '..', 'contract', 'src');
  const managedDir = path.join(contractSourceDir, 'managed');

  if (!fs.existsSync(contractSourceDir)) {
    throw new Error(`Contract source directory not found: ${contractSourceDir}`);
  }

  const files = fs.readdirSync(contractSourceDir);
  const compactFiles = files.filter((file) => file.endsWith('.compact'));

  if (compactFiles.length === 0) {
    throw new Error(`No .compact files found in ${contractSourceDir}`);
  }

  const contractFileName = compactFiles[0];
  const contractName = path.basename(contractFileName, '.compact');
  const expectedManagedPath = path.join(managedDir, contractName);

  console.log(`🔍 Config: Detected contract "${contractName}" from ${contractFileName}`);

  if (!fs.existsSync(expectedManagedPath)) {
    console.log(`⚠️  Managed directory not found: ${expectedManagedPath}`);
    console.log(`💡 Run: npm run compile`);
  }

  return expectedManagedPath;
}

export const contractConfig = {
  privateStateStoreName: 'eligibility-private-state',
  zkConfigPath: detectContractPath(),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

/** Local standalone network (Docker-based, NetworkId.Undeployed) */
export class StandaloneConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString().replace(/:/g, '-')}.log`);
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.Undeployed);
  }
}

/** Testnet local (Docker proof server + remote testnet) */
export class TestnetLocalConfig implements Config {
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-local',
    `${new Date().toISOString().replace(/:/g, '-')}.log`,
  );
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}

/** Preprod / Preview remote network */
export class PreprodConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod', `${new Date().toISOString().replace(/:/g, '-')}.log`);
  indexer = process.env.INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql';
  indexerWS = process.env.INDEXER_WS_URL || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
  node = process.env.NODE_URL || 'https://rpc.preprod.midnight.network';
  proofServer = process.env.PROOF_SERVER_URL || 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}

/** Testnet-02 remote (for CI/testing) */
export class TestnetRemoteConfig implements Config {
  logDir = path.resolve(
    currentDir,
    '..',
    'logs',
    'testnet-remote',
    `${new Date().toISOString().replace(/:/g, '-')}.log`,
  );
  indexer = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
  indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet-02.midnight.network';
  proofServer = process.env.PROOF_SERVER_URL || 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}
