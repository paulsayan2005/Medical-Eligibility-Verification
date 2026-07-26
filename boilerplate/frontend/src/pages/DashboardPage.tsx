import { useWallet } from '../context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ShieldCheck, Clock, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function DashboardPage() {
  const { connectorAPI, contractAddress } = useWallet();

  if (!connectorAPI) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome to Midnight Auth</h2>
        <p className="text-muted-foreground mb-8">
          Connect your Midnight Lace wallet to verify your medical eligibility and manage your confidential credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your verification status and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Connected</div>
            <p className="text-xs text-muted-foreground">Midnight Testnet</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Credentials</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractAddress ? '1' : '0'}</div>
            <p className="text-xs text-muted-foreground">Valid proofs generated</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {contractAddress ? (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">Contract Deployed</div>
                  <div className="text-muted-foreground font-mono text-xs">{contractAddress.slice(0, 12)}...</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No recent activity found on-chain.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Verify Eligibility</CardTitle>
            <CardDescription>
              Generate a Zero-Knowledge proof of your medical eligibility to share with providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/verify">
              <Button className="w-full sm:w-auto gap-2">
                Start Verification <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Credential Vault</CardTitle>
            <CardDescription>
              View and manage your previously issued confidential credentials and verification history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/vault">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                Open Vault <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
