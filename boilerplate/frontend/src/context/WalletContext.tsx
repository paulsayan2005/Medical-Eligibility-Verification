import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { DAppConnectorAPI, DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

export interface DetectedWallet {
  id: string;
  name: string;
  icon?: string;
  isInstalled: boolean;
  downloadUrl: string;
  connector?: DAppConnectorAPI;
  isDemo?: boolean;
  description?: string;
}

export interface WalletContextType {
  connectorAPI: DAppConnectorAPI | null;
  walletAPI: DAppConnectorWalletAPI | null;
  contractAddress: string;
  updateTrigger: number;
  walletName: string | null;
  walletIcon: string | null;
  coinPublicKey: string | null;
  encryptionPublicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectingWalletId: string | null;
  error: string | null;
  isModalOpen: boolean;
  availableWallets: DetectedWallet[];
  activeWallet: DetectedWallet | null;
  
  setConnectorAPI: (api: DAppConnectorAPI | null) => void;
  setWalletAPI: (api: any | null) => void;
  setContractAddress: (address: string) => void;
  triggerUpdate: () => void;
  setIsModalOpen: (open: boolean) => void;
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
  clearError: () => void;
  refreshWallets: () => void;
  findLaceExtension: () => DetectedWallet | null;
  connectLaceDirectly: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const DEMO_COIN_PUBLIC_KEY = '0x00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
const DEMO_ENCRYPTION_PUBLIC_KEY = '0xffee00112233445566778899aabbccddeeff00112233445566778899aabbcc';

const createDemoWallet = (): { connector: DAppConnectorAPI; wallet: DAppConnectorWalletAPI } => {
  const wallet: any = {
    state: async () => ({
      coinPublicKey: DEMO_COIN_PUBLIC_KEY,
      encryptionPublicKey: DEMO_ENCRYPTION_PUBLIC_KEY,
    }),
    balanceAndProveTransaction: async (tx: any) => tx,
    submitTransaction: async () =>
      '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  };

  const connector: DAppConnectorAPI = {
    apiVersion: '1.0.0',
    name: 'Midnight DevNet Demo Wallet',
    icon: '',
    isEnabled: async () => true,
    enable: async () => wallet,
  } as unknown as DAppConnectorAPI;

  return { connector, wallet };
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connectorAPI, setConnectorAPI] = useState<DAppConnectorAPI | null>(null);
  const [walletAPI, setWalletAPI] = useState<DAppConnectorWalletAPI | null>(null);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [updateTrigger, setUpdateTrigger] = useState<number>(0);

  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletIcon, setWalletIcon] = useState<string | null>(null);
  const [coinPublicKey, setCoinPublicKey] = useState<string | null>(null);
  const [encryptionPublicKey, setEncryptionPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<DetectedWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<DetectedWallet | null>(null);

  const triggerUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const scanWallets = useCallback((): DetectedWallet[] => {
    const wallets: DetectedWallet[] = [];
    const win = window as any;

    // 1. Midnight injected wallets (e.g. Lace Midnight)
    if (win.midnight) {
      Object.keys(win.midnight).forEach((key) => {
        const provider = win.midnight[key];
        if (provider && typeof provider.enable === 'function') {
          wallets.push({
            id: `midnight-${key}`,
            name: provider.name || (key === 'mnLace' ? 'Lace (Midnight)' : `Midnight Wallet (${key})`),
            icon: provider.icon,
            isInstalled: true,
            downloadUrl: 'https://www.lace.io/',
            connector: provider,
            description: 'Official Midnight Network Privacy Wallet',
          });
        }
      });
    }

    // Default Lace Midnight placeholder if not detected under window.midnight
    if (!wallets.some((w) => w.id === 'midnight-mnLace' || w.id === 'midnight-lace')) {
      wallets.push({
        id: 'midnight-mnLace',
        name: 'Lace (Midnight)',
        icon: 'https://www.lace.io/favicon.ico',
        isInstalled: false,
        downloadUrl: 'https://www.lace.io/',
        description: 'Official Web3 Privacy Wallet for Midnight Network',
      });
    }

    // 2. Cardano CIP-30 wallets (Lace Cardano, Eternl, Nami, Flint)
    const cardanoWallets = [
      { id: 'cardano-lace', key: 'lace', name: 'Lace (Cardano)', url: 'https://www.lace.io/', desc: 'Light wallet platform for Cardano & Midnight' },
      { id: 'cardano-eternl', key: 'eternl', name: 'Eternl Wallet', url: 'https://eternl.io/', desc: 'Feature-rich Cardano extension wallet' },
      { id: 'cardano-nami', key: 'nami', name: 'Nami Wallet', url: 'https://namiwallet.io/', desc: 'Browser extension wallet for Cardano' },
      { id: 'cardano-flint', key: 'flint', name: 'Flint Wallet', url: 'https://flint-wallet.com/', desc: 'Lightweight browser wallet' },
    ];

    cardanoWallets.forEach((cw) => {
      const provider = win.cardano?.[cw.key];
      const isInstalled = !!(provider && typeof provider.enable === 'function');
      wallets.push({
        id: cw.id,
        name: provider?.name || cw.name,
        icon: provider?.icon || undefined,
        isInstalled,
        downloadUrl: cw.url,
        connector: isInstalled ? provider : undefined,
        description: cw.desc,
      });
    });

    // 3. Built-in Midnight DevNet Demo Wallet
    wallets.push({
      id: 'devnet-demo',
      name: 'Midnight DevNet Demo Wallet',
      icon: undefined,
      isInstalled: true,
      downloadUrl: '#',
      isDemo: true,
      description: 'Simulated wallet for quick testing & demonstration without extension',
    });

    return wallets;
  }, []);

  const refreshWallets = useCallback(() => {
    setAvailableWallets(scanWallets());
  }, [scanWallets]);

  const findLaceExtension = useCallback((): DetectedWallet | null => {
    const currentWallets = scanWallets();
    const lace = currentWallets.find(
      (w) => w.isInstalled && w.connector && (w.id.includes('mnLace') || w.id.includes('lace') || w.name.toLowerCase().includes('lace'))
    );
    return lace || null;
  }, [scanWallets]);

  // Initial scan & periodic re-scan for late injected extension scripts
  useEffect(() => {
    refreshWallets();
    const interval = setInterval(refreshWallets, 1000);
    return () => clearInterval(interval);
  }, [refreshWallets]);

  const disconnectWallet = useCallback(() => {
    setConnectorAPI(null);
    setWalletAPI(null);
    setWalletName(null);
    setWalletIcon(null);
    setCoinPublicKey(null);
    setEncryptionPublicKey(null);
    setIsConnected(false);
    setActiveWallet(null);
    setContractAddress('');
    setError(null);
    localStorage.removeItem('midnight_wallet_id');
  }, []);

  const connectWallet = useCallback(
    async (walletId: string) => {
      try {
        setIsConnecting(true);
        setConnectingWalletId(walletId);
        setError(null);

        // Perform live fresh scan
        let currentWallets = scanWallets();
        let targetWallet = currentWallets.find((w) => w.id === walletId || w.id.endsWith(walletId));

        // If trying to connect Lace, check if Lace was injected under another key
        if ((!targetWallet || !targetWallet.isInstalled) && walletId.toLowerCase().includes('lace')) {
          const liveLace = currentWallets.find(
            (w) => w.isInstalled && w.connector && (w.id.includes('lace') || w.name.toLowerCase().includes('lace'))
          );
          if (liveLace) {
            targetWallet = liveLace;
          }
        }

        if (!targetWallet) {
          throw new Error('Selected wallet provider could not be found.');
        }

        if (targetWallet.isDemo) {
          const { connector, wallet } = createDemoWallet();
          setConnectorAPI(connector);
          setWalletAPI(wallet);
          setWalletName(targetWallet.name);
          setWalletIcon(null);
          setCoinPublicKey(DEMO_COIN_PUBLIC_KEY);
          setEncryptionPublicKey(DEMO_ENCRYPTION_PUBLIC_KEY);
          setIsConnected(true);
          setActiveWallet(targetWallet);
          localStorage.setItem('midnight_wallet_id', walletId);
          setIsModalOpen(false);
          return;
        }

        if (!targetWallet.isInstalled || !targetWallet.connector) {
          window.open(targetWallet.downloadUrl, '_blank');
          setError(`${targetWallet.name} extension not detected in browser. Opening download page (${targetWallet.downloadUrl})...`);
          return;
        }

        // Connect real browser extension (triggers Lace extension popup!)
        const connector = targetWallet.connector;
        const api: DAppConnectorWalletAPI = await connector.enable();
        
        let coinPubKey = '';
        let encPubKey = '';

        if (api && typeof api.state === 'function') {
          try {
            const state = await api.state();
            coinPubKey = state?.coinPublicKey || '';
            encPubKey = state?.encryptionPublicKey || '';
          } catch (stErr) {
            console.warn('Could not fetch wallet state:', stErr);
          }
        }

        setConnectorAPI(connector);
        setWalletAPI(api);
        setWalletName(targetWallet.name);
        setWalletIcon(targetWallet.icon || null);
        setCoinPublicKey(coinPubKey || 'Connected');
        setEncryptionPublicKey(encPubKey || 'Connected');
        setIsConnected(true);
        setActiveWallet(targetWallet);
        localStorage.setItem('midnight_wallet_id', targetWallet.id);
        setIsModalOpen(false);
      } catch (err: any) {
        console.error('Failed to connect wallet:', err);
        setError(err?.message || 'Failed to connect wallet. Request was cancelled or wallet extension is locked.');
      } finally {
        setIsConnecting(false);
        setConnectingWalletId(null);
      }
    },
    [scanWallets]
  );

  const connectLaceDirectly = useCallback(async (): Promise<boolean> => {
    refreshWallets();
    const lace = findLaceExtension();
    if (lace) {
      await connectWallet(lace.id);
      return true;
    }
    return false;
  }, [findLaceExtension, connectWallet, refreshWallets]);

  // Auto connect if previously saved
  useEffect(() => {
    const savedWalletId = localStorage.getItem('midnight_wallet_id');
    if (savedWalletId && !isConnected && !isConnecting) {
      const timer = setTimeout(() => {
        connectWallet(savedWalletId).catch(() => {
          localStorage.removeItem('midnight_wallet_id');
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        connectorAPI,
        walletAPI,
        contractAddress,
        updateTrigger,
        walletName,
        walletIcon,
        coinPublicKey,
        encryptionPublicKey,
        isConnected,
        isConnecting,
        connectingWalletId,
        error,
        isModalOpen,
        availableWallets,
        activeWallet,
        setConnectorAPI,
        setWalletAPI,
        setContractAddress,
        triggerUpdate,
        setIsModalOpen,
        connectWallet,
        disconnectWallet,
        clearError,
        refreshWallets,
        findLaceExtension,
        connectLaceDirectly,
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
