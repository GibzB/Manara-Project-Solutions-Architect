# Serverless Image Processing Pipeline

AWS Solutions Architect - Associate Certification Project

## Project 2: Serverless Image Processing Pipeline

A serverless image processing pipeline that automatically processes images uploaded to S3 using SQS, Lambda, Step Functions, DynamoDB, CloudFront, and SNS.

## Architecture

```
Client → API Gateway → S3 (Source) → SQS → Lambda → S3 (Destination) → CloudFront
                                           ↓
                                       DynamoDB
                                           ↓
                                       SNS Notifications
```

## Key AWS Services

- **S3**: Source and destination buckets with lifecycle policies
- **SQS**: Decoupled message queue with dead-letter queue
- **Lambda**: Image processing (resize, watermark)
- **Step Functions**: Workflow orchestration
- **DynamoDB**: Job metadata storage
- **CloudFront**: Global CDN for image delivery
- **SNS**: Notifications for job status

## Getting Started

1. Clone this repository
2. Navigate to the `cdk` directory
3. Install dependencies: `npm install`
4. Deploy: `npx cdk deploy`

## License

MIT License
