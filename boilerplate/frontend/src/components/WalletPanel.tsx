import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { WalletModal } from './WalletModal';
import { Wallet, Loader2, ChevronDown } from 'lucide-react';

export const WalletPanel: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    walletName,
    walletIcon,
    coinPublicKey,
    setIsModalOpen,
    connectLaceDirectly,
  } = useWallet();

  const handleWalletButtonClick = async () => {
    if (isConnected) {
      setIsModalOpen(true);
      return;
    }

    // Try connecting to Lace directly if detected
    const connectedLace = await connectLaceDirectly();
    if (!connectedLace) {
      // If Lace is not installed in browser, open modal for options / installation link
      setIsModalOpen(true);
    }
  };

  const formatKey = (key: string | null) => {
    if (!key) return '';
    if (key.length <= 12) return key;
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  return (
    <>
      {isConnected ? (
        <Button
          variant="outline"
          onClick={handleWalletButtonClick}
          className="gap-2.5 bg-background/80 hover:bg-accent border-emerald-500/30 text-foreground font-medium shadow-sm transition-all cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          {walletIcon ? (
            <img src={walletIcon} alt="" className="h-4 w-4 rounded-sm object-contain" />
          ) : (
            <Wallet className="h-4 w-4 text-emerald-500" />
          )}

          <span className="hidden sm:inline font-mono text-xs">
            {coinPublicKey ? formatKey(coinPublicKey) : walletName || 'Connected'}
          </span>

          <Badge variant="success" className="text-[10px] px-1.5 py-0 hidden md:inline-flex">
            {walletName?.includes('Lace') ? 'Lace' : 'Active'}
          </Badge>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
        </Button>
      ) : (
        <Button
          onClick={handleWalletButtonClick}
          disabled={isConnecting}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-medium transition-all cursor-pointer"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </Button>
      )}

      {/* Global Wallet Selection & Detail Modal */}
      <WalletModal />
    </>
  );
};
