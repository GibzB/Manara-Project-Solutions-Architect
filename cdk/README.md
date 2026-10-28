# Serverless Image Processing Pipeline - CDK Stack

This CDK stack sets up the S3 infrastructure for a serverless image processing pipeline.

## Architecture

```
┌─────────────────┐
│   Source Bucket │
│  (Incoming images) │
└────────┬────────┘
         │
         │ S3 Event Notification
         ▼
┌─────────────────┐
│    SQS Queue    │
│   (Event Queue) │
└────────┬────────┘
         │
         │ Lambda Trigger
         ▼
┌─────────────────┐
│  Lambda Function│
│  (Image Process)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Destination     │
│ Bucket          │
│ (Processed      │
│  images)        │
└─────────────────┘

┌─────────────────┐
│ Temporary Bucket│
│ (Intermediate   │
│  files)         │
└─────────────────┘

┌─────────────────┐
│ Access Logs     │
│ Bucket          │
└─────────────────┘
```

## Buckets Created

### 1. Source Bucket (`source-images-[env]`)
- **Purpose**: Stores incoming images for processing
- **Features**:
  - Versioning enabled
  - Public access blocked
  - S3 event notifications to SQS queue
  - Lifecycle policy: Transitions to Glacier after 30 days
  - Noncurrent version expiration: 90 days

### 2. Destination Bucket (`processed-images-[env]`)
- **Purpose**: Stores processed images
- **Features**:
  - Versioning enabled
  - Public access blocked
  - Origin Access Identity configured for CloudFront
  - Lifecycle policy: Transitions to Glacier after 90 days
  - Noncurrent version expiration: 90 days

### 3. Temporary Bucket (`processing-temp-[env]`)
- **Purpose**: Stores intermediate files during processing
- **Features**:
  - No versioning
  - Public access blocked
  - Lifecycle policy: Objects deleted after 1 day

### 4. Access Logs Bucket (`s3-access-logs-[env]`)
- **Purpose**: Stores S3 access logs for all buckets
- **Features**:
  - Versioning enabled
  - Public access blocked
  - Lifecycle policy: Logs deleted after 90 days

## Setup Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js 18+ installed
3. AWS CDK CLI installed globally:
   ```bash
   npm install -g aws-cdk
   ```

### Installation

```bash
cd src/cdk
npm install
```

### Configuration

Set the environment variable for your deployment environment:

```bash
export CDK_ENVIRONMENT=dev  # or staging, prod
export CDK_DEFAULT_REGION=us-east-1
```

### Deployment

Deploy the stack:

```bash
cdk deploy
```

### Cleanup

To destroy all resources:

```bash
cdk destroy
```

## Outputs

After deployment, the following outputs will be available:

- **SourceBucketName**: Name of the source S3 bucket
- **DestinationBucketName**: Name of the destination S3 bucket
- **TempBucketName**: Name of the temporary bucket
- **AccessLogsBucketName**: Name of the access logs bucket
- **EventQueueUrl**: URL of the SQS queue for S3 events
- **EventQueueArn**: ARN of the SQS queue for S3 events
- **OAIIdentity**: Origin Access Identity for CloudFront

## Lifecycle Policies

| Bucket | Transition to Glacier | Delete Noncurrent Versions |
|--------|----------------------|---------------------------|
| Source | 30 days | 90 days |
| Destination | 90 days | 90 days |
| Temporary | N/A | 1 day (delete all) |
| Access Logs | N/A | 90 days |

## Security Features

- All buckets have public access blocked
- Server-side encryption enabled (SSE-S3)
- Versioning enabled for source and destination buckets
- Access logging enabled for all buckets
- OAI configured for CloudFront access to destination bucket