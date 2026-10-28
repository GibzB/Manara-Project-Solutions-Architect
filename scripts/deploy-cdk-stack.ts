#!/usr/bin/env ts-node
/**
 * Script to deploy the Image Processing Pipeline CDK stack
 * Usage: ts-node scripts/deploy-cdk-stack.ts --environment=dev
 */

import * as child_process from 'child_process';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface Args {
  environment: string;
  region?: string;
  deploy?: boolean;
  destroy?: boolean;
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
  .option('deploy', {
    describe: 'Deploy the stack',
    type: 'boolean',
    default: true,
  })
  .option('destroy', {
    describe: 'Destroy the stack',
    type: 'boolean',
    default: false,
  })
  .help()
  .argv;

const { environment, region, deploy, destroy } = argv as Args;

// Set environment variables
process.env.CDK_ENVIRONMENT = environment;
process.env.CDK_DEFAULT_REGION = region;

const cdkDir = 'src/cdk';

console.log(`\n🚀 Image Processing Pipeline CDK Deployment`);
console.log(`========================================`);
console.log(`Environment: ${environment}`);
console.log(`Region: ${region}\n`);

// Run cdk bootstrap if needed
console.log(`📋 Checking CDK bootstrap...`);
try {
  child_process.execSync(`cd ${cdkDir} && npx cdk bootstrap`, {
    stdio: 'inherit',
  });
} catch (error) {
  console.log('CDK bootstrap may already be done');
}

// Show diff before deploy
if (deploy && !destroy) {
  console.log(`🔍 Showing stack diff...`);
  try {
    child_process.execSync(`cd ${cdkDir} && npx cdk diff`, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.log('Diff command completed (exit code may be non-zero for new stacks)');
  }

  // Deploy the stack
  console.log(`\n📦 Deploying stack...`);
  try {
    child_process.execSync(`cd ${cdkDir} && npx cdk deploy --require-approval never`, {
      stdio: 'inherit',
    });
    console.log(`\n✅ Stack deployed successfully for environment: ${environment}`);
  } catch (error) {
    console.error(`\n❌ Deployment failed: ${error}`);
    process.exit(1);
  }
}

// Destroy the stack
if (destroy) {
  console.log(`\n💣 Destroying stack...`);
  try {
    child_process.execSync(`cd ${cdkDir} && npx cdk destroy --force`, {
      stdio: 'inherit',
    });
    console.log(`\n✅ Stack destroyed successfully for environment: ${environment}`);
  } catch (error) {
    console.error(`\n❌ Destruction failed: ${error}`);
    process.exit(1);
  }
}

console.log('\n📋 Stack Outputs:');
console.log('-----------------');
try {
  const output = child_process.execSync(`cd ${cdkDir} && npx cdk output`, {
    encoding: 'utf-8',
  });
  console.log(output);
} catch (error) {
  console.log('Unable to retrieve outputs (stack may not be deployed yet)');
}
