import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Lock, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-6 h-16 flex items-center border-b">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span>Midnight Auth</span>
        </div>
        <div className="ml-auto flex gap-4">
          <Link to="/app">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/app">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-6"
        >
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-muted">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Powered by Midnight Network
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Medical Eligibility, <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              Verified Privately.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Prove your medical eligibility without revealing your underlying personal data. 
            Using Zero-Knowledge cryptography on the Midnight blockchain.
          </p>
          
          <div className="pt-4 flex justify-center gap-4">
            <Link to="/app">
              <Button size="lg" className="gap-2">
                Launch App <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/app/privacy">
              <Button size="lg" variant="outline">
                How it works
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-24 grid sm:grid-cols-3 gap-8 max-w-5xl text-left"
        >
          <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur">
            <Lock className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-xl mb-2">Absolute Privacy</h3>
            <p className="text-muted-foreground">Your medical records never leave your device. We only verify the cryptographic proof.</p>
          </div>
          <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur">
            <ShieldCheck className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-xl mb-2">Tamper-Proof</h3>
            <p className="text-muted-foreground">Verifications are anchored on the Midnight blockchain, providing immutable audit trails.</p>
          </div>
          <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur">
            <Zap className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-xl mb-2">Instant Validation</h3>
            <p className="text-muted-foreground">Service providers can verify your credentials instantly without costly manual checks.</p>
          </div>
        </motion.div>
      </main>
      
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026 Midnight Auth. All rights reserved.
      </footer>
    </div>
  );
}
