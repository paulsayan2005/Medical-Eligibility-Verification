import React, { useState, useEffect } from 'react';
import type { DAppConnectorAPI, DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

export const WalletPanel: React.FC<{
  onConnect: (api: DAppConnectorAPI, walletAPI: DAppConnectorWalletAPI) => void;
  onDisconnect: () => void;
}> = ({ onConnect, onDisconnect }) => {
  const [connector, setConnector] = useState<DAppConnectorAPI | null>(null);
  const [walletAPI, setWalletAPI] = useState<DAppConnectorWalletAPI | null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if Lace is available
    const checkLace = () => {
      // @ts-ignore
      const lace = window.midnight?.mnLace as DAppConnectorAPI;
      if (lace) {
        setConnector(lace);
      }
    };
    
    checkLace();
    const interval = setInterval(checkLace, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    if (!connector) {
      setError('Lace wallet not found. Please install the Midnight Lace extension.');
      return;
    }
    
    try {
      const api = await connector.enable();
      setWalletAPI(api);
      
      const state = await api.state();
      setAddress(state.address);
      
      onConnect(connector, api);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to connect to Lace wallet.');
    }
  };

  const disconnect = () => {
    setWalletAPI(null);
    setAddress('');
    onDisconnect();
  };

  return (
    <div className="panel">
      <h2>Wallet Connection</h2>
      
      {error && <div className="result-box result-error mb-4">{error}</div>}
      
      {!walletAPI ? (
        <div className="text-center mt-4">
          <p className="mb-4 text-muted">Connect your Lace wallet to interact with the Midnight network.</p>
          <button 
            className="btn btn-primary w-full" 
            onClick={connect}
            disabled={!connector}
          >
            {connector ? 'Connect Lace Wallet' : 'Lace Wallet Not Found'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between align-center mb-4">
            <span className="status-badge status-connected">
              <span className="dot"></span> Connected
            </span>
            <button className="btn btn-secondary" onClick={disconnect}>
              Disconnect
            </button>
          </div>
          
          <div className="form-group">
            <label>Wallet Address</label>
            <input 
              type="text" 
              className="form-input" 
              value={address} 
              readOnly 
            />
          </div>
        </div>
      )}
    </div>
  );
};
