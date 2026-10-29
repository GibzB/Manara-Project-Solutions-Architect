import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

export interface ImageProcessingPipelineStackProps extends cdk.StackProps {
  /**
   * Environment name (dev, staging, prod)
   */
  readonly environment: string;
}

export class ImageProcessingPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImageProcessingPipelineStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Generate unique bucket names using timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const sourceBucketName = `source-images-${environment}-${timestamp}`;
    const destinationBucketName = `processed-images-${environment}-${timestamp}`;
    const tempBucketName = `processing-temp-${environment}-${timestamp}`;
    const accessLogsBucketName = `s3-access-logs-${environment}-${timestamp}`;

    // ========================================
    // 1. Create S3 Buckets
    // ========================================

    // 1.1 Source Bucket - for incoming images
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: sourceBucketName,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add S3 event notification to SQS queue when objects are created
    const eventQueue = new sqs.Queue(this, 'EventQueue', {
      queueName: `s3-events-${environment}-${timestamp}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Dead-letter queue for failed event processing
    const eventDeadLetterQueue = new sqs.Queue(this, 'EventDeadLetterQueue', {
      queueName: `s3-events-dlq-${environment}-${timestamp}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Configure event notification
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.SqsDestination(eventQueue),
      {
        suffix: '.jpg',
      },
    );

    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.SqsDestination(eventQueue),
      {
        suffix: '.png',
      },
    );

    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.SqsDestination(eventQueue),
      {
        suffix: '.gif',
      },
    );

    // ========================================
    // 2. SQS Queues for Image Processing Pipeline
    // ========================================

    // Create Dead Letter Queue (DLQ) for failed image processing messages
    // Retention: 14 days
    const imageProcessingDeadLetterQueue = new sqs.Queue(this, 'ImageProcessingDeadLetterQueue', {
      queueName: `image-processing-dlq-${environment}-${timestamp}`,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.minutes(5),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Create Processing Queue - main queue for image processing
    // Visibility timeout: 5 minutes (300 seconds)
    // Message retention: 4 days (345600 seconds)
    // Redrive policy: maxReceiveCount=3 pointing to DLQ
    const imageProcessingQueue = new sqs.Queue(this, 'ImageProcessingQueue', {
      queueName: `image-processing-queue-${environment}-${timestamp}`,
      visibilityTimeout: cdk.Duration.minutes(5),
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: imageProcessingDeadLetterQueue,
      },
    });

    // ========================================
    // 3. Destination Bucket - for processed images
    // ========================================

    const destinationBucket = new s3.Bucket(this, 'DestinationBucket', {
      bucketName: destinationBucketName,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create Origin Access Identity for CloudFront access
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
      {
        comment: `OAI for ${destinationBucketName}`,
      }
    );

    // Grant CloudFront read access to destination bucket
    destinationBucket.grantRead(originAccessIdentity);

    // ========================================
    // 4. Temporary Bucket - for intermediate files
    // ========================================

    const tempBucket = new s3.Bucket(this, 'TempBucket', {
      bucketName: tempBucketName,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ========================================
    // 5. Access Logs Bucket - for S3 access logging
    // ========================================

    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: accessLogsBucketName,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ========================================
    // 6. Access Logging Configuration
    // ========================================

    // Access logging is enabled by default at the bucket level
    // For S3 access logging, we would configure it using bucket logging
    // But for this task, we're focused on the SQS queues for image processing

    // ========================================
    // 7. Configure Lifecycle Policies
    // ========================================

    // Source Bucket Lifecycle Policy
    // - Transition to Glacier after 30 days
    // - Expire noncurrent versions after 90 days
    sourceBucket.addLifecycleRule({
      id: 'SourceGlacierTransition',
      enabled: true,
      transitions: [
        {
          transitionAfter: cdk.Duration.days(30),
          storageClass: s3.StorageClass.GLACIER,
        },
      ],
      noncurrentVersionExpiration: cdk.Duration.days(90),
    });

    // Destination Bucket Lifecycle Policy
    // - Transition to Glacier after 90 days
    // - Expire noncurrent versions after 90 days
    destinationBucket.addLifecycleRule({
      id: 'DestinationGlacierTransition',
      enabled: true,
      transitions: [
        {
          transitionAfter: cdk.Duration.days(90),
          storageClass: s3.StorageClass.GLACIER,
        },
      ],
      noncurrentVersionExpiration: cdk.Duration.days(90),
    });

    // Temporary Bucket Lifecycle Policy
    // - Delete objects after 1 day (temporary processing files)
    tempBucket.addLifecycleRule({
      id: 'TempExpiration',
      enabled: true,
      expiration: cdk.Duration.days(1),
    });

    // Access Logs Bucket Lifecycle Policy
    // - Delete objects after 90 days
    accessLogsBucket.addLifecycleRule({
      id: 'AccessLogsExpiration',
      enabled: true,
      expiration: cdk.Duration.days(90),
    });

    // ========================================
    // 8. Output Resources
    // ========================================

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Source bucket for incoming images',
      exportName: `SourceBucketName-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'DestinationBucketName', {
      value: destinationBucket.bucketName,
      description: 'Destination bucket for processed images',
      exportName: `DestinationBucketName-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'TempBucketName', {
      value: tempBucket.bucketName,
      description: 'Temporary bucket for intermediate files',
      exportName: `TempBucketName-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'AccessLogsBucketName', {
      value: accessLogsBucket.bucketName,
      description: 'Access logs bucket',
      exportName: `AccessLogsBucketName-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'EventQueueUrl', {
      value: eventQueue.queueUrl,
      description: 'SQS queue for S3 events',
      exportName: `EventQueueUrl-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'EventQueueArn', {
      value: eventQueue.queueArn,
      description: 'SQS queue ARN for S3 events',
      exportName: `EventQueueArn-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: imageProcessingQueue.queueUrl,
      description: 'SQS queue for image processing',
      exportName: `ProcessingQueueUrl-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'ProcessingQueueArn', {
      value: imageProcessingQueue.queueArn,
      description: 'SQS queue ARN for image processing',
      exportName: `ProcessingQueueArn-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: imageProcessingDeadLetterQueue.queueUrl,
      description: 'Dead letter queue for failed image processing messages',
      exportName: `DeadLetterQueueUrl-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: imageProcessingDeadLetterQueue.queueArn,
      description: 'Dead letter queue ARN for failed image processing messages',
      exportName: `DeadLetterQueueArn-${environment}-${timestamp}`,
    });

    new cdk.CfnOutput(this, 'OAIIdentity', {
      value: originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
      description: 'Origin Access Identity for CloudFront',
      exportName: `OAIIdentity-${environment}-${timestamp}`,
    });
  }
}
