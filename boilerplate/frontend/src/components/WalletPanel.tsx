import React, { useState, useEffect } from 'react';
import type { DAppConnectorAPI, DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Button } from './ui/Button';
import { Wallet } from 'lucide-react';

export const WalletPanel: React.FC<{
  onConnect: (api: DAppConnectorAPI, walletAPI: DAppConnectorWalletAPI) => void;
  onDisconnect: () => void;
}> = ({ onConnect }) => {
  const [connector, setConnector] = useState<DAppConnectorAPI | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
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
    if (!connector) return;
    
    try {
      setIsConnecting(true);
      const api = await connector.enable();
      onConnect(connector, api);
    } catch (err) {
      console.error('Failed to connect', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button 
      onClick={connect} 
      disabled={!connector || isConnecting}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isConnecting ? 'Connecting...' : connector ? 'Connect Wallet' : 'Lace Not Found'}
      </span>
    </Button>
  );
};
