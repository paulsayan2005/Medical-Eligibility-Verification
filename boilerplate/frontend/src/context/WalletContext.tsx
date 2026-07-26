import { createContext, useContext, useState, type ReactNode } from 'react';
import { type DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';

interface WalletContextType {
  connectorAPI: DAppConnectorAPI | null;
  walletAPI: any | null;
  contractAddress: string;
  updateTrigger: number;
  setConnectorAPI: (api: DAppConnectorAPI | null) => void;
  setWalletAPI: (api: any | null) => void;
  setContractAddress: (address: string) => void;
  triggerUpdate: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connectorAPI, setConnectorAPI] = useState<DAppConnectorAPI | null>(null);
  const [walletAPI, setWalletAPI] = useState<any | null>(null);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [updateTrigger, setUpdateTrigger] = useState<number>(0);

  const triggerUpdate = () => {
    setUpdateTrigger((prev) => prev + 1);
  };

  return (
    <WalletContext.Provider
      value={{
        connectorAPI,
        walletAPI,
        contractAddress,
        updateTrigger,
        setConnectorAPI,
        setWalletAPI,
        setContractAddress,
        triggerUpdate,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
