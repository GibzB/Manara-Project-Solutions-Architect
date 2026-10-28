# Requirements Document

## Introduction

This project implements a serverless image processing pipeline that automatically processes images uploaded to an S3 bucket. When an image is uploaded to the source bucket, the event triggers an SQS queue that decouples the upload from processing. A Lambda function polls the queue and performs image transformations including resizing and watermarking. The processed images are stored in a destination S3 bucket. Step Functions orchestrate complex multi-step workflows, DynamoDB stores metadata, CloudFront serves images globally, and SNS notifies stakeholders of job completion or failure. This architecture demonstrates event-driven design patterns using core AWS services.

## Glossary

- **ImageProcessingPipeline**: The complete system that processes images through multiple stages including validation, transformation, and storage
- **SourceBucket**: The S3 bucket that receives initial image uploads and publishes events to SQS
- **DestinationBucket**: The S3 bucket that stores processed images after all transformations complete
- **ProcessingQueue**: The SQS queue that decouples image upload events from processing work
- **DeadLetterQueue**: The SQS queue that receives messages that fail processing after maximum retry attempts
- **ImageProcessorLambda**: The AWS Lambda function that performs image resizing and watermarking
- **ImageTransformer**: A module within ImageProcessorLambda that handles specific transformations (resize, watermark, metadata extraction)
- **StepFunctionWorkflow**: The AWS Step Functions state machine that orchestrates multi-step image processing workflows
- **MetadataStore**: The DynamoDB table that stores image metadata including upload time, dimensions, processing status, and URLs
- **CloudFrontDistribution**: The Amazon CloudFront distribution that serves processed images with low latency globally
- **PreSignedUrlGenerator**: The API Gateway endpoint that generates time-limited pre-signed URLs for secure uploads
- **NotificationTopic**: The SNS topic that publishes job completion and failure notifications
- **ImageFormat**: Supported image formats including JPEG, PNG, GIF, and WebP
- **ProcessingJob**: A single unit of work representing the processing of one image through a defined workflow

## Requirements

### Requirement 1: S3 Source Bucket Event Publishing

**User Story:** As a user uploading images, I want my uploads to trigger automatic processing, so that images are transformed without manual intervention.

#### Acceptance Criteria

1. WHEN an object is created in the SourceBucket, THE S3 event notification SHALL publish a message to the ProcessingQueue
2. THE SourceBucket SHALL support uploads of ImageFormat files (JPEG, PNG, GIF, WebP)
3. IF an upload fails validation (non-image file, corrupted file), THEN THE SourceBucket SHALL not publish a message to the ProcessingQueue
4. WHEN an object is deleted from the SourceBucket, THE S3 event notification SHALL publish a deletion message to the ProcessingQueue

### Requirement 2: SQS Queue Decoupling

**User Story:** As a system operator, I want events decoupled from processing, so that the system remains resilient during traffic spikes and processing failures.

#### Acceptance Criteria

1. WHEN a message is received from the ProcessingQueue, THE ImageProcessorLambda SHALL process exactly once per message
2. WHILE the ImageProcessorLambda is processing a message, THE message SHALL remain invisible to other consumers (visibility timeout)
3. IF processing of a message fails, THEN THE message SHALL be returned to the ProcessingQueue for retry
4. WHEN a message has been retried maximum times without success, THEN THE message SHALL be moved to the DeadLetterQueue
5. THE ProcessingQueue SHALL support at-least-once delivery of messages
6. WHEN multiple processing jobs occur simultaneously, THE ProcessingQueue SHALL handle concurrent polling by multiple Lambda instances

### Requirement 3: Lambda Image Processing

**User Story:** As a developer, I want images processed efficiently, so that users receive transformed images quickly.

#### Acceptance Criteria

1. WHEN a processing message is received, THE ImageProcessorLambda SHALL read the source image from the SourceBucket
2. THE ImageProcessorLambda SHALL resize images to predefined dimensions: thumbnail (150x150), medium (640x640), and full-resolution (original max dimension 2048px)
3. THE ImageProcessorLambda SHALL apply a watermark overlay to all processed images
4. WHEN resizing is complete, THE ImageProcessorLambda SHALL store results in the DestinationBucket with appropriate naming convention
5. IF an image file is corrupted or invalid, THEN THE ImageProcessorLambda SHALL return an error response and publish failure notification
6. WHEN image processing completes, THE ImageProcessorLambda SHALL update the MetadataStore with processing results

### Requirement 4: Lambda Layer for Image Libraries

**User Story:** As a developer, I want image processing libraries easily managed, so that I can update dependencies without redeploying Lambda code.

#### Acceptance Criteria

1. THE ImageProcessorLambda SHALL use a Lambda Layer that contains Pillow (Python) or Sharp (Node.js) image processing libraries
2. WHEN the ImageProcessorLambda starts, THE libraries in the Lambda Layer SHALL be available for import without code changes
3. THE Lambda Layer SHALL support processing of ImageFormat files within 2000ms for images under 5MB
4. WHEN the Lambda Layer is updated, EXISTING Lambda functions SHALL continue to use the previous layer version until explicitly updated

### Requirement 5: Step Functions Workflow Orchestration

**User Story:** As a system designer, I want complex workflows orchestrated, so that multi-step processing tasks execute reliably.

#### Acceptance Criteria

1. WHEN a processing request requires multiple transformations, THE StepFunctionWorkflow SHALL execute in defined order: validate → resize → watermark → store
2. IF any workflow step fails, THEN THE StepFunctionWorkflow SHALL retry the failed step up to three times
3. WHILE a workflow is executing, THE StepFunctionWorkflow SHALL maintain state and allow progress tracking
4. WHEN all workflow steps complete successfully, THEN THE StepFunctionWorkflow SHALL publish a completion message to the NotificationTopic
5. IF a workflow fails after maximum retries, THEN THE StepFunctionWorkflow SHALL publish a failure message to the NotificationTopic and store the failed job in the MetadataStore

### Requirement 6: DynamoDB Metadata Storage

**User Story:** As an application user, I want processing status visible, so that I can track when my images are ready.

#### Acceptance Criteria

1. WHEN a processing job starts, THE MetadataStore SHALL create a record with status "PENDING"
2. WHILE processing is in progress, THE MetadataStore SHALL update the job record with current step and progress percentage
3. WHEN all processing completes successfully, THE MetadataStore SHALL update the job record with status "COMPLETED" and include output URLs
4. IF processing fails, THEN THE MetadataStore SHALL update the job record with status "FAILED" and include error details
5. THE MetadataStore SHALL store the following attributes: jobId, userId, originalUrl, thumbnailUrl, mediumUrl, fullResolutionUrl, processingStatus, createdAt, completedAt, errorDetails
6. WHEN a user queries by userId, THE MetadataStore SHALL return all jobs for that user within 500ms

### Requirement 7: Pre-Signed URL Generation

**User Story:** As a secure upload endpoint, I want to generate pre-signed URLs, so that users can upload directly to S3 without exposing credentials.

#### Acceptance Criteria

1. WHEN a pre-signed URL request is received, THE PreSignedUrlGenerator SHALL generate a time-limited URL valid for 15 minutes
2. THE PreSignedUrlGenerator SHALL validate the user's authentication token before generating the URL
3. THE generated URL SHALL permit only PUT operations to the SourceBucket
4. WHEN the URL expires, THE PreSignedUrlGenerator SHALL NOT allow uploads using that URL

### Requirement 8: CloudFront Image Delivery

**User Story:** As a global user, I want processed images served quickly, so that I have a good experience regardless of location.

#### Acceptance Criteria

1. WHEN an image is requested from CloudFront, THE CloudFrontDistribution SHALL return the image from edge location cache if available
2. IF the image is not in the cache, THEN CloudFrontDistribution SHALL fetch from the DestinationBucket origin
3. THE CloudFrontDistribution SHALL support custom domain mapping for image serving
4. WHEN an image in the DestinationBucket is updated, THE CloudFrontDistribution SHALL invalidate the cache within 60 seconds
5. THE CloudFrontDistribution SHALL return processed images with Cache-Control headers set to "public, max-age=31536000"

### Requirement 9: SNS Notifications

**User Story:** As a system operator, I want processing status notifications, so that I can respond to failures and monitor pipeline health.

#### Acceptance Criteria

1. WHEN a processing job completes successfully, THE NotificationTopic SHALL publish a completion message containing jobId, output URLs, and processing time
2. WHEN a processing job fails after all retries, THE NotificationTopic SHALL publish a failure message containing jobId, error details, and retry count
3. WHEN a message is moved to the DeadLetterQueue, THE NotificationTopic SHALL publish a DLQ notification with message body and failure reason
4. THE NotificationTopic SHALL support multiple subscribers including email, Lambda functions, and HTTP endpoints

### Requirement 10: S3 Lifecycle Management

**User Story:** As a cost-conscious operator, I want old objects managed automatically, so that storage costs remain predictable.

#### Acceptance Criteria

1. FOR objects in the SourceBucket older than 30 days, THE S3 lifecycle policy SHALL transition objects to Glacier storage class
2. FOR objects in the DestinationBucket older than 90 days, THE S3 lifecycle policy SHALL transition objects to Glacier storage class
3. FOR objects in the DeadLetterQueue (accessed via S3 access points or logs), THE S3 lifecycle policy SHALL expire and delete objects after 14 days
4. FOR objects in the SourceBucket and DestinationBucket, THE S3 lifecycle policy SHALL enable versioning and expire noncurrent versions after 90 days

### Requirement 11: Security and Access Control

**User Story:** As a security officer, I want all components secured, so that unauthorized users cannot access or modify processed images.

#### Acceptance Criteria

1. THE SourceBucket SHALL enforce bucket policy that permits put objects only from authenticated users with valid pre-signed URLs
2. THE DestinationBucket SHALL enforce bucket policy that permits read access only through CloudFrontDistribution (Origin Access Identity)
3. THE ImageProcessorLambda SHALL execute with minimal IAM permissions, accessing only SourceBucket, DestinationBucket, and MetadataStore
4. WHEN processing jobs are stored in MetadataStore, THE records SHALL be encrypted at rest using AWS KMS
5. THE NotificationTopic SHALL enforce access policy that permits only ImageProcessorLambda and StepFunctionWorkflow to publish messages

### Requirement 12: Monitoring and Logging

**User Story:** As a DevOps engineer, I want system health visible, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. WHEN image processing begins, THE ImageProcessorLambda SHALL log start time, source key, and requested transformations
2. WHEN image processing completes, THE ImageProcessorLambda SHALL log end time, output sizes, and processing duration
3. IF processing fails, THE ImageProcessorLambda SHALL log error message, stack trace, and source image details
4. THE CloudFrontDistribution SHALL log all requests to a separate S3 bucket for analysis
5. WHEN Lambda execution exceeds 90% of timeout threshold, THE ImageProcessorLambda SHALL log warning with current step and memory usage

### Requirement 13: Processing Job Query and Status

**User Story:** As a user, I want to check job status, so that I know when my images are ready.

#### Acceptance Criteria

1. WHEN a status query is received with a valid jobId, THE MetadataStore SHALL return the job record within 200ms
2. IF no job exists for the provided jobId, THEN THE MetadataStore SHALL return a "not found" response
3. WHEN querying jobs by userId, THE MetadataStore SHALL return jobs sorted by createdAt timestamp in descending order
4. THE query response SHALL include all job attributes: jobId, status, progress, output URLs, and timestamps

### Requirement 14: Image Validation

**User Story:** As a quality controller, I want only valid images processed, so that the pipeline maintains integrity.

#### Acceptance Criteria

1. WHEN an upload is received, THE ImageProcessorLambda SHALL validate that the file is a valid ImageFormat before processing
2. IF the file type is not recognized or the file is corrupted, THEN THE ImageProcessorLambda SHALL reject the job and publish failure notification
3. WHEN file size exceeds 10MB, THEN THE ImageProcessorLambda SHALL reject the job with a size error response
4. WHEN image dimensions exceed 10000x10000 pixels, THEN THE ImageProcessorLambda SHALL reject the job with a dimension error response

### Requirement 15: Watermark Configuration

**User Story:** As a branding manager, I want watermark settings configurable, so that I can adjust appearance without code changes.

#### Acceptance Criteria

1. WHEN watermark configuration is updated, THE ImageProcessorLambda SHALL apply new settings to subsequent jobs without restart
2. THE watermark SHALL support configurable position options: top-left, top-right, bottom-left, bottom-right, center
3. THE watermark SHALL support configurable opacity between 0.1 and 1.0
4. THE watermark SHALL support configurable scaling as percentage of image dimensions (10% to 50%)
5. WHEN a watermark image is updated in the designated bucket, THE ImageProcessorLambda SHALL fetch the latest version for subsequent jobs
