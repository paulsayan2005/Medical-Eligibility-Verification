import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useWallet } from '../context/WalletContext';

export default function HistoryPage() {
  const { contractAddress } = useWallet();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Verification History</h2>
        <p className="text-muted-foreground">Audit log of your interactions on the Midnight Network.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A timeline of all Zero-Knowledge verifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative border-l border-muted ml-3 space-y-8 pb-4">
            
            {contractAddress ? (
              <div className="relative pl-6">
                <span className="absolute -left-1.5 top-1.5 flex h-3 w-3 rounded-full bg-green-500 ring-4 ring-background"></span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Contract Deployed & Verified</h4>
                    <time className="text-xs text-muted-foreground">Just now</time>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A Zero-Knowledge proof was generated and verified successfully on the Midnight Network.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{contractAddress.slice(0, 16)}...</Badge>
                    <Badge variant="success">Verified</Badge>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative pl-6">
              <span className="absolute -left-1.5 top-1.5 flex h-3 w-3 rounded-full bg-primary ring-4 ring-background"></span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Wallet Connected</h4>
                  <time className="text-xs text-muted-foreground">Today</time>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lace wallet successfully connected to the dApp.
                </p>
              </div>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-1.5 top-1.5 flex h-3 w-3 rounded-full bg-muted ring-4 ring-background"></span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Account Initialized</h4>
                  <time className="text-xs text-muted-foreground">Earlier</time>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
