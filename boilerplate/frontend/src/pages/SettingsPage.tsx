import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { Sun, Moon, Laptop, Network } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isConnected, walletName, disconnectWallet, setIsModalOpen } = useWallet();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your application preferences and connections.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'} 
              className="gap-2" 
              onClick={() => setTheme('light')}
            >
              <Sun className="h-4 w-4" /> Light
            </Button>
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'} 
              className="gap-2" 
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-4 w-4" /> Dark
            </Button>
            <Button 
              variant={theme === 'system' ? 'default' : 'outline'} 
              className="gap-2" 
              onClick={() => setTheme('system')}
            >
              <Laptop className="h-4 w-4" /> System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network & Wallet</CardTitle>
          <CardDescription>Manage your Midnight network connection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Network className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">Midnight Testnet</div>
                <div className="text-sm text-muted-foreground">
                  {isConnected ? `Connected via ${walletName || 'Web3 Wallet'}` : 'Not Connected'}
                </div>
              </div>
            </div>
            {isConnected ? (
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>Manage Wallet</Button>
            ) : (
              <Button onClick={() => setIsModalOpen(true)}>Connect Wallet</Button>
            )}
          </div>

          {isConnected && (
            <div className="pt-4 flex justify-end">
              <Button 
                variant="destructive" 
                onClick={disconnectWallet}
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
