#!/usr/bin/env ts-node
/**
 * Script to destroy the Image Processing Pipeline CDK stack
 * Usage: ts-node scripts/destroy-cdk-stack.ts --environment=dev
 */

import * as child_process from 'child_process';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface Args {
  environment: string;
  region?: string;
}

const argv = yargs(hideBin(process.argv))
  .option('environment', {
    describe: 'Deployment environment (dev, staging, prod)',
    type: 'string',
    demandOption: true,
  })
  .option('region', {
    describe: 'AWS region',
    type: 'string',
    default: 'us-east-1',
  })
  .help()
  .argv;

const { environment, region } = argv as Args;

// Set environment variables
process.env.CDK_ENVIRONMENT = environment;
process.env.CDK_DEFAULT_REGION = region;

const cdkDir = 'src/cdk';

console.log(`\n💣 Destroying Image Processing Pipeline Stack`);
console.log(`==============================================`);
console.log(`Environment: ${environment}`);
console.log(`Region: ${region}\n`);

try {
  child_process.execSync(`cd ${cdkDir} && npx cdk destroy --force`, {
    stdio: 'inherit',
  });
  console.log(`\n✅ Stack destroyed successfully for environment: ${environment}`);
} catch (error) {
  console.error(`\n❌ Destruction failed: ${error}`);
  process.exit(1);
}
