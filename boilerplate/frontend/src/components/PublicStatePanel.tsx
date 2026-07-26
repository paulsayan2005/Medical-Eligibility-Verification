import React, { useEffect, useState } from 'react';
import { type DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { configureProviders, getEligibilityLedgerState, type EligibilityLedgerState } from '../api.js';

export const PublicStatePanel: React.FC<{
  connectorAPI: DAppConnectorAPI | null;
  walletAPI: any;
  contractAddress: string;
  updateTrigger: number;
}> = ({ connectorAPI, walletAPI, contractAddress, updateTrigger }) => {
  const [state, setState] = useState<EligibilityLedgerState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!connectorAPI || !contractAddress) {
      setState(null);
      return;
    }

    const fetchState = async () => {
      setLoading(true);
      setError('');
      try {
        const providers = await configureProviders(connectorAPI, walletAPI);
        // Cast to any to bypass strict type checking for ContractAddress in this demo
        const ledgerState = await getEligibilityLedgerState(providers, contractAddress as unknown as ContractAddress);
        setState(ledgerState);
      } catch (err) {
        console.error(err);
        setError('Failed to load ledger state');
      } finally {
        setLoading(false);
      }
    };

    fetchState();
  }, [connectorAPI, walletAPI, contractAddress, updateTrigger]);

  if (!contractAddress) return null;

  return (
    <div className="panel">
      <h2>Public Ledger State</h2>
      <p className="text-muted mb-4">
        This is the global public state visible to everyone on the Midnight network.
        Individual verifications increment these counters, but patient details are never recorded here.
      </p>

      {loading && <p className="text-muted">Loading state...</p>}
      {error && <p className="error">{error}</p>}

      {state && !loading && (
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{state.verificationCount.toString()}</div>
            <div className="stat-label">Total Verifications</div>
          </div>
          <div className="stat-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{state.eligibleCount.toString()}</div>
            <div className="stat-label">Eligible Results</div>
          </div>
          <div className="stat-box" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="stat-value" style={{ color: 'var(--error)' }}>{state.ineligibleCount.toString()}</div>
            <div className="stat-label">Ineligible Results</div>
          </div>
        </div>
      )}
    </div>
  );
};
