import readline from 'node:readline';
import { pino } from 'pino';
import { createEligibilityPrivateState, hashPolicyId } from '@midnight-ntwrk/contract';
import {
  buildWalletAndWaitForFunds,
  configureProviders,
  deployEligibilityContract,
  getEligibilityLedgerState,
  joinEligibilityContract,
  randomBytes,
  setLogger,
  verifyEligibility,
} from './api.js';
import { StandaloneConfig } from './config.js';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

// ============================================================
// Medical Eligibility Verification — Interactive CLI
// ============================================================

const logger = pino({ level: 'info' });
setLogger(logger);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> => new Promise((resolve) => rl.question(question, resolve));

const askNumber = async (question: string, min = 0, max = 255): Promise<number> => {
  while (true) {
    const answer = await ask(question);
    const n = parseInt(answer.trim(), 10);
    if (!isNaN(n) && n >= min && n <= max) return n;
    console.log(`  ⚠️  Please enter a number between ${min} and ${max}`);
  }
};

async function printBanner() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   🏥  Medical Eligibility Verification               ║');
  console.log('║   Powered by Midnight Confidential Credentials       ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
}

async function printMenu() {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │  MENU                                   │');
  console.log('  │  1. Deploy new contract                 │');
  console.log('  │  2. Join existing contract              │');
  console.log('  │  3. Verify patient eligibility          │');
  console.log('  │  4. View public ledger state            │');
  console.log('  │  5. Exit                                │');
  console.log('  └─────────────────────────────────────────┘');
}

async function main() {
  await printBanner();

  const config = new StandaloneConfig();

  console.log('🔧 Using Standalone (local) network config');
  console.log(`   Indexer:      ${config.indexer}`);
  console.log(`   Node:         ${config.node}`);
  console.log(`   Proof Server: ${config.proofServer}`);
  console.log('');

  const seed = process.env.WALLET_SEED ?? toHex(randomBytes(32));
  console.log(`🔑 Wallet seed: ${seed}`);

  let wallet;
  try {
    wallet = await buildWalletAndWaitForFunds(config, seed);
  } catch (err) {
    console.error('');
    console.error('❌ Could not connect to Midnight network.');
    console.error('   Make sure the standalone Docker network is running:');
    console.error('   docker compose -f standalone.yml up -d');
    console.error('');
    console.error(`   Error: ${err instanceof Error ? err.message : String(err)}`);
    rl.close();
    process.exit(1);
  }

  const providers = await configureProviders(wallet, config);
  let contractAddress: string | null = null;

  while (true) {
    await printMenu();
    const choice = (await ask('\n  Enter choice: ')).trim();

    switch (choice) {
      case '1': {
        // Deploy
        console.log('\n  📋 Deploy a new Medical Eligibility Verification contract');
        const age = await askNumber('  Enter your age (private, 0-255): ', 0, 255);
        const policyId = await ask('  Enter your policy ID (private, any string): ');

        const privateState = createEligibilityPrivateState(age, hashPolicyId(policyId.trim()));
        console.log('\n  🔐 Privacy: your age and policy ID will NOT appear on-chain');
        console.log('  ⏳ Deploying...');

        try {
          const deployed = await deployEligibilityContract(providers, privateState);
          contractAddress = deployed.deployTxData.public.contractAddress as string;
          console.log(`\n  ✅ Contract deployed!`);
          console.log(`  📬 Contract address: ${contractAddress}`);
        } catch (err) {
          console.error(`\n  ❌ Deploy failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        break;
      }

      case '2': {
        // Join
        const addr = (await ask('  Enter contract address: ')).trim();
        const age = await askNumber('  Enter your age (private, 0-255): ', 0, 255);
        const policyId = await ask('  Enter your policy ID (private): ');

        const privateState = createEligibilityPrivateState(age, hashPolicyId(policyId.trim()));

        try {
          await joinEligibilityContract(providers, addr, privateState);
          contractAddress = addr;
          console.log(`\n  ✅ Joined contract at ${addr}`);
        } catch (err) {
          console.error(`\n  ❌ Join failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        break;
      }

      case '3': {
        // Verify eligibility
        if (!contractAddress) {
          console.log('\n  ⚠️  No contract. Deploy or join one first (options 1 or 2).');
          break;
        }

        const minAge = await askNumber('  Enter minimum age requirement (e.g. 18): ', 0, 255);
        const age = await askNumber('  Enter patient age (private, 0-255): ', 0, 255);
        const policyId = await ask('  Enter patient policy ID (private): ');

        const privateState = createEligibilityPrivateState(age, hashPolicyId(policyId.trim()));

        console.log('\n  🔐 Privacy: age and policy ID stay local — only ZK proof sent');
        console.log('  ⏳ Generating proof and submitting transaction...');

        try {
          const eligible = await verifyEligibility(providers, contractAddress, minAge, privateState);

          if (eligible) {
            console.log('\n  ╔══════════════════════════════════╗');
            console.log('  ║  ✅  PATIENT IS ELIGIBLE          ║');
            console.log('  ╚══════════════════════════════════╝');
          } else {
            console.log('\n  ╔══════════════════════════════════╗');
            console.log('  ║  ❌  PATIENT IS NOT ELIGIBLE      ║');
            console.log('  ╚══════════════════════════════════╝');
          }
          console.log('  (Age and policy ID were NOT revealed on-chain)');
        } catch (err) {
          console.error(`\n  ❌ Verification failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        break;
      }

      case '4': {
        // View ledger
        if (!contractAddress) {
          console.log('\n  ⚠️  No contract. Deploy or join one first.');
          break;
        }

        try {
          const state = await getEligibilityLedgerState(
            providers,
            contractAddress as unknown as import('@midnight-ntwrk/compact-runtime').ContractAddress,
          );
          if (!state) {
            console.log('\n  ⚠️  Could not fetch ledger state');
          } else {
            console.log('\n  📊 Public Ledger State:');
            console.log(`     Total verifications : ${state.verificationCount}`);
            console.log(`     Eligible results    : ${state.eligibleCount}`);
            console.log(`     Ineligible results  : ${state.ineligibleCount}`);
            console.log('');
            console.log('  (Individual patient data is NOT visible in the above)');
          }
        } catch (err) {
          console.error(`\n  ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
        }
        break;
      }

      case '5':
        console.log('\n  👋 Goodbye!\n');
        rl.close();
        await wallet.close();
        process.exit(0);
        break;

      default:
        console.log('\n  ⚠️  Invalid choice. Enter 1-5.');
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
