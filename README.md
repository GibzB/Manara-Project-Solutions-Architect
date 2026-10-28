# Serverless Image Processing Pipeline

AWS Solutions Architect - Associate Certification Project

## Project 2: Serverless Image Processing Pipeline

A serverless image processing pipeline that automatically processes images uploaded to S3 using SQS, Lambda, Step Functions, DynamoDB, CloudFront, and SNS.

## Architecture Diagram

[![Open in draw.io](https://img.shields.io/badge/Open%20in-draw.io-blue)](https://viewer.diagrams.net/#ReJzNmN1umzAUx-_3FBZ7gMSQkEQJlZZkzSZ10yo07dqBE0A1GBnThD39jqHD2dpeVDNiucnxAft8_Cz_gU1-OUhWpl9EDJzEl8ChM9d1SNwEzsJbOSSRWYzOzgizn4CDKY7qLIaqvaCE4Coru0EkigIi1dpMSnHu3CfBu1VKlkBvhBHjZvQji1UaOK7n-Z3jE2RJqpfy5zOHHFn0kEhRF7jQ-1P7c0jO9BTMp0pZLM7avHlHyEYKobSBZn7ZAedEVzF1Js-dbXQJhXrlOjbjkfEa89zxDG-bfK9AYkDV6NzbhCAO6PqcZgrCkkUQnLGj61TlHN04G6SCyx-BqNPFaSMdQOSgZEPwnhmW0nR_564dVNvpUyd8tBl2NHma0uc76RJ-nr3XZ__h22dyYArOrBkqe9d6-rM-VYhxv7SmkCoViSgY__jbtzaFPCUew4nVXN2xI_Btv3N2ggsZ6L2FlekV_6qLVKKW2AINXTGZgNIdfKlaCZyp7LFb4G01zXskYRuNbOvoAdRgW8o6FH8kKJ6BMrcNZWGg3IfkvoYahgLiWweyHAnI3ABZ2Aay6oHcsfwYs6FoLK3T0PI4Co6FwbGyjYPSnsceKpUVuJAoBj666NQ-HHckOCsDh75c8L_Q8a4eUkQd30pRDEfFvszTsXReb-sei3Wlp0bqh3xopPYlno6l8fRK5Kl1ladG5vdNwXKx3_Z14htECUHU8AwLkp5ddaGvoVm-Hc1Yan99glmXe2r0Pvwamgo5xzdLsAvD9a3BcMfS-msY1sXeNWIfKijJbV1EWu6roR_CvKW1E8z9D4TetSD0m0n3LUP7zJeam1-OxI08)

Click the button above to view and edit the architecture diagram in draw.io.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Client     │────▶│ API Gateway │────▶│ Source Bucket│────▶│   SQS Queue │
│ / User      │     │             │     │              │     │             │
└─────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
                                                                     │
                                                                     ▼
                                                         ┌─────────────┐
                                                         │  Lambda     │
                                                         │             │
                                                         └──────┬──────┘
                                                                │
                                         ┌─────────────┐    │    ┌──────────────┐
                                         │ DynamoDB    │◀───┘   │Destination   │
                                         │             │        │  Bucket      │
                                         └─────────────┘        │              │
                                                                └──────┬───────┘
                                                                     │
                                                                     ▼
                                                         ┌─────────────┐
                                                         │ CloudFront  │
                                                         │             │
                                                         └──────┬──────┘
                                                                │
                                                                ▼
                                                         ┌─────────────┐
                                                         │   User      │
                                                         └─────────────┘

                                  ┌─────────────┐
                                  │   SNS       │
                                  │             │
                                  └─────────────┘
                                       ▲
                                       │
                                  ┌────┴─────┐
                                  │ Step     │
                                  │ Functions│
                                  └──────────┘
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
