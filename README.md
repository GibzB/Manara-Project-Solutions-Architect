# Serverless Image Processing Pipeline

AWS Solutions Architect - Associate Certification Project

## Project 2: Serverless Image Processing Pipeline

A serverless image processing pipeline that automatically processes images uploaded to S3 using SQS, Lambda, Step Functions, DynamoDB, CloudFront, and SNS.

## Architecture Diagram

[![Open in draw.io](https://img.shields.io/badge/Open%20in-draw.io-blue)](https://viewer.diagrams.net/#ReJzNmN1umzAUx-_3FBZ7gMSQkEQJlZZkzSZ10yo07dqBE0A1GBnThD39jqHD2dpeVDNiucnxAft8_Cz_gU1-OUhWpl9EDJzEl8ChM9d1SNwEzsJbOSSRWYzOzgizn4CDKY7qLIaqvaCE4Coru0EkigIi1dpMSnHu3CfBu1VKlkBvhBHjZvQji1UaOK7n-Z3jE2RJqpfy5zOHHFn0kEhRF7jQ-1P7c0jO9BTMp0pZLM7avHlHyEYKobSBZn7ZAedEVzF1Js-dbXQJhXrlOjbjkfEa89zxDG_DWKrRabe5QBzQ9TnNFIQliyA4YzPXqco5unEiSAWXP2JQpwvRBjmAyEHJhuA9M6yi6f7OXSeottOnJvhoM2xm8jSlT3XS5fo8ca9P_MO3z-TAFJxZM1T2rvX0Z32qEONWaU0hVSoSUTD-8bdvbQp5SjyGE6u5umNH4Nt-0-wEFzLQ2wor0yv-VRepRC2xBZq3YjIBpTv4UrUSOFPZY7fA22qa90jCNhrZ1tEDDLelrEPxR4LiGShz21AWBsp9SO5rqGEoIL51IMuRgMwNkIVtIKseyB3LjzEbisbSOg2tjKPgWBgcK9s4KO157KFSWYELiWLgo4tO7cNxR4KzMnDoywX_Cx3v6vlE1PGtFMM9o1D7Mk_H0nm9rXss1pWeGqn_XoEcDIh9iadjaTy9EnlqXeWpkfl9U7Bc7Ld9nfjyUEIQNTzDgqRnV13oa2iWb0czltpfn2DW5Z4avQ-_hqZCzvGlEuzCcH1rMNyxtP4ahnWxd43YhwpKclsXkZb7auiHMG9p7QRz_wOhdy0I_WbSfcbQPvOR5uYX_N6Lbg)

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
