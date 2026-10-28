import * as cdk from 'aws-cdk-lib';
import { ImageProcessingPipelineStack } from './stacks/image-processing-pipeline-stack';

// Read environment from environment variable or use default
const environment = process.env.CDK_ENVIRONMENT || 'dev';

const app = new cdk.App();

new ImageProcessingPipelineStack(app, 'ImageProcessingPipelineStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment: environment,
});

app.synth();
