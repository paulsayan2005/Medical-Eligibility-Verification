export interface Config {
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
}

export const NetworkId = 'testnet'; // or 'standalone'

export const contractConfig = {
  privateStateStoreName: 'eligibility-private-state',
  zkConfigPath: '/zkir/medical-eligibility-verification.zkir',
};

// Default standalone (local) config for browser
export const currentConfig: Config = {
  indexer: import.meta.env.VITE_INDEXER_URL || 'http://127.0.0.1:8088/api/v1/graphql',
  indexerWS: import.meta.env.VITE_INDEXER_WS_URL || 'ws://127.0.0.1:8088/api/v1/graphql/ws',
  node: import.meta.env.VITE_NODE_URL || 'http://127.0.0.1:9944',
  proofServer: import.meta.env.VITE_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
};
