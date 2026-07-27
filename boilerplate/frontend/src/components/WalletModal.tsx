import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  Wallet,
  X,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ArrowRightLeft,
  Search,
} from 'lucide-react';

export const WalletModal: React.FC = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    availableWallets,
    isConnected,
    isConnecting,
    connectingWalletId,
    walletName,
    walletIcon,
    coinPublicKey,
    encryptionPublicKey,
    connectWallet,
    disconnectWallet,
    error,
    clearError,
    refreshWallets,
    findLaceExtension,
    connectLaceDirectly,
  } = useWallet();

  const [copiedCoinKey, setCopiedCoinKey] = useState(false);
  const [copiedEncKey, setCopiedEncKey] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const [isSearchingLace, setIsSearchingLace] = useState(false);

  if (!isModalOpen) return null;

  const handleCopyCoinKey = () => {
    if (coinPublicKey) {
      navigator.clipboard.writeText(coinPublicKey);
      setCopiedCoinKey(true);
      setTimeout(() => setCopiedCoinKey(false), 2000);
    }
  };

  const handleCopyEncKey = () => {
    if (encryptionPublicKey) {
      navigator.clipboard.writeText(encryptionPublicKey);
      setCopiedEncKey(true);
      setTimeout(() => setCopiedEncKey(false), 2000);
    }
  };

  const handleFindLaceClick = async () => {
    setIsSearchingLace(true);
    clearError();
    refreshWallets();
    
    // Short delay to allow window.midnight check
    setTimeout(async () => {
      const connected = await connectLaceDirectly();
      setIsSearchingLace(false);
      if (!connected) {
        // Open Lace install page if not found
        window.open('https://www.lace.io/', '_blank');
      }
    }, 400);
  };

  const formatKey = (key: string | null) => {
    if (!key) return 'N/A';
    if (key.length <= 16) return key;
    return `${key.slice(0, 10)}...${key.slice(-8)}`;
  };

  const activeConnectedView = isConnected && !showWalletSelection;
  const installedLace = findLaceExtension();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md transition-opacity cursor-default"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="relative w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border/80 shadow-2xl overflow-hidden transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {activeConnectedView ? 'Wallet Connected' : 'Connect Wallet'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {activeConnectedView
                  ? 'Manage your active Web3 wallet session'
                  : 'Select a wallet or connect to Lace extension'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 text-xs rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
              </div>
              <button onClick={clearError} className="text-destructive/80 hover:text-destructive cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {activeConnectedView ? (
            /* Active Connected Wallet Details View */
            <div className="space-y-4">
              {/* Wallet Info Card */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {walletIcon ? (
                    <img src={walletIcon} alt={walletName || 'Wallet'} className="h-10 w-10 rounded-lg object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{walletName}</span>
                      <Badge variant="success" className="text-[10px] px-2 py-0">
                        Connected
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Midnight Network Testnet</p>
                  </div>
                </div>
              </div>

              {/* Keys Details */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Coin Public Key
                  </label>
                  <div className="flex items-center gap-2 bg-muted/50 p-2.5 rounded-lg border border-border/60">
                    <code className="text-xs flex-1 font-mono text-foreground break-all">{formatKey(coinPublicKey)}</code>
                    <Button variant="ghost" size="sm" onClick={handleCopyCoinKey} className="h-7 px-2 text-xs gap-1 cursor-pointer">
                      {copiedCoinKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCoinKey ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Encryption Public Key
                  </label>
                  <div className="flex items-center gap-2 bg-muted/50 p-2.5 rounded-lg border border-border/60">
                    <code className="text-xs flex-1 font-mono text-foreground break-all">{formatKey(encryptionPublicKey)}</code>
                    <Button variant="ghost" size="sm" onClick={handleCopyEncKey} className="h-7 px-2 text-xs gap-1 cursor-pointer">
                      {copiedEncKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedEncKey ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connected Actions */}
              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWalletSelection(true)}
                  className="flex-1 gap-2 text-xs cursor-pointer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Switch Wallet
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    disconnectWallet();
                    setShowWalletSelection(false);
                  }}
                  className="flex-1 gap-2 text-xs cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          ) : (
            /* Wallet Selection List */
            <div className="space-y-4">
              {/* Primary Action Banner for Lace Extension */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      L
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Lace Midnight Extension</h4>
                      <p className="text-xs text-muted-foreground">
                        {installedLace ? 'Lace extension detected!' : 'Connect directly to Lace Web3 Privacy Wallet.'}
                      </p>
                    </div>
                  </div>
                  {installedLace ? (
                    <Badge variant="success" className="text-[10px] px-2 py-0.5">
                      Detected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      Recommended
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleFindLaceClick}
                  disabled={isSearchingLace || isConnecting}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium cursor-pointer shadow-md"
                >
                  {isSearchingLace || (isConnecting && connectingWalletId?.includes('lace')) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting to Lace Extension...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>{installedLace ? 'Connect Lace Extension' : 'Find Lace Extension / Install'}</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>All Options ({availableWallets.length})</span>
                <button
                  onClick={refreshWallets}
                  className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {availableWallets.map((wallet) => {
                  const isThisConnecting = isConnecting && connectingWalletId === wallet.id;

                  return (
                    <div
                      key={wallet.id}
                      onClick={() => {
                        if (!isConnecting) {
                          connectWallet(wallet.id);
                        }
                      }}
                      className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        wallet.isInstalled
                          ? 'border-border/80 bg-background hover:border-primary hover:bg-accent/40 shadow-sm'
                          : 'border-dashed border-border/60 bg-muted/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
                          {wallet.icon ? (
                            <img src={wallet.icon} alt={wallet.name} className="h-6 w-6 object-contain" />
                          ) : wallet.isDemo ? (
                            <Sparkles className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Wallet className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {wallet.name}
                            </span>
                            {wallet.id.includes('mnLace') && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                                Recommended
                              </Badge>
                            )}
                            {wallet.isDemo && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                Instant Demo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {wallet.description || (wallet.isInstalled ? 'Ready to connect' : 'Extension not detected')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isThisConnecting ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : wallet.isInstalled ? (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                            <span>Connect</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        ) : (
                          <a
                            href={wallet.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline cursor-pointer"
                          >
                            <span>Install</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Midnight Network standard dApp connector</span>
          {showWalletSelection && isConnected && (
            <button
              onClick={() => setShowWalletSelection(false)}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Back to Active Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
