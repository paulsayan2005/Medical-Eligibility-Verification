import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Lock, EyeOff, ShieldCheck, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">How Midnight Privacy Works</h2>
        <p className="text-muted-foreground">Understanding Zero-Knowledge cryptography and Confidential Smart Contracts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" /> Zero-Knowledge Proofs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A Zero-Knowledge Proof (ZKP) allows you to prove that you meet a certain condition (e.g., "I am over 18") without revealing the underlying data (your exact age or birthdate).
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you generate a proof in this dApp, the mathematical heavy lifting happens locally in your browser. The network only receives the proof, not your data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Confidential State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Midnight allows smart contracts to have both a Public State and a Confidential State. Confidential state is encrypted and only accessible to authorized parties.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your exact medical data (like your Policy ID) remains part of your private local state and is never broadcasted to the blockchain ledger.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture Flow</CardTitle>
          <CardDescription>How your data flows during verification.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 px-4 rounded-xl bg-muted/30">
            <div className="flex flex-col items-center text-center max-w-[120px]">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Local Device</span>
              <span className="text-xs text-muted-foreground mt-1">Private State & Prover</span>
            </div>
            
            <div className="hidden sm:flex flex-1 h-0.5 bg-border items-center justify-center relative">
              <span className="absolute bg-background px-2 text-xs text-muted-foreground font-mono">ZK Proof</span>
            </div>

            <div className="flex flex-col items-center text-center max-w-[120px]">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Midnight Network</span>
              <span className="text-xs text-muted-foreground mt-1">Public Ledger & Verifier</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
