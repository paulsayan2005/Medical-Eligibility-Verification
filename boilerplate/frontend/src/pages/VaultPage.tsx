import { useWallet } from '../context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Download, Share2, WalletCards, Key, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VaultPage() {
  const { contractAddress, connectorAPI } = useWallet();

  // Mock data to demonstrate the UI
  const credentials = [
    {
      id: "cred_1234",
      type: "Medical Eligibility",
      issuer: "National Health Authority",
      issueDate: "2026-07-26",
      status: contractAddress ? "active" : "pending",
      network: "Midnight Testnet",
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Credential Vault</h2>
        <p className="text-muted-foreground">Manage your issued confidential credentials and Zero-Knowledge proofs.</p>
      </div>

      {!connectorAPI && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 flex items-start gap-3 text-sm">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-400">Connect wallet to activate credentials</p>
            <p className="text-muted-foreground mt-0.5">Connect your Midnight Lace Wallet and run a verification to activate your credential status.</p>
          </div>
        </div>
      )}
      {credentials.map((cred, i) => (
        <motion.div
          key={cred.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between pb-4">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <WalletCards className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{cred.type}</CardTitle>
                  <CardDescription className="mt-1">Issued by {cred.issuer}</CardDescription>
                </div>
              </div>
              <Badge variant={cred.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                {cred.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6 p-4 rounded-lg bg-muted/50 border">
                <div>
                  <div className="text-muted-foreground mb-1">Issue Date</div>
                  <div className="font-medium">{cred.issueDate}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Network</div>
                  <div className="font-medium">{cred.network}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Privacy Level</div>
                  <div className="font-medium flex items-center gap-1">
                    <Key className="h-3 w-3" /> Zero-Knowledge
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Contract Hash</div>
                  <div className="font-mono">{contractAddress ? contractAddress.slice(0, 8) + '...' : '---'}</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" disabled={cred.status !== 'active'}>
                  <Download className="h-4 w-4" /> Download Proof
                </Button>
                <Button variant="outline" className="gap-2" disabled={cred.status !== 'active'}>
                  <Share2 className="h-4 w-4" /> Share Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
