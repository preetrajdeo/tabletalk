# Sub-Processors for TableTalk

**Last Updated:** January 2025

## Overview

TableTalk uses the following sub-processors to deliver its services. This document provides transparency about which third-party services process user data and how we ensure they maintain appropriate security and privacy standards.

## Active Sub-Processors

### 1. OpenAI, Inc.

- **Purpose:** AI-powered natural language processing for table creation and editing
- **Data Shared:** User table descriptions and edit requests
- **Location:** United States
- **Privacy Policy:** https://openai.com/privacy
- **Terms of Service:** https://openai.com/policies/terms-of-use
- **Data Processing Agreement:** Covered under OpenAI API Terms
- **Security & Compliance:** SOC 2 Type II certified, GDPR compliant

### 2. Railway Corp

- **Purpose:** Cloud hosting and infrastructure
- **Data Shared:** Server logs, error logs, API requests (no permanent user content)
- **Location:** United States
- **Privacy Policy:** https://railway.app/legal/privacy
- **Terms of Service:** https://railway.app/legal/terms
- **Security & Compliance:** SOC 2 Type II compliant infrastructure

## Data Protection Standards

All sub-processors are carefully selected and required to maintain appropriate security and privacy standards. We ensure that:

- Sub-processors comply with applicable data protection laws (GDPR, CCPA)
- Data is transmitted securely using encryption (HTTPS/TLS)
- Sub-processors only access data necessary to provide their specific service
- Sub-processors maintain their own privacy policies and security certifications
- Sub-processors do not use customer data for their own purposes beyond providing the service

## Data Flow

### Table Creation Process
1. User submits table description via Slack
2. TableTalk receives request on Railway infrastructure
3. Request is sent to OpenAI API for processing
4. OpenAI returns structured table data
5. TableTalk formats and posts table to Slack
6. No data is permanently stored by TableTalk

### Table Editing Process
1. User submits edit request via Slack
2. TableTalk receives request on Railway infrastructure
3. Original table and edit instructions sent to OpenAI API
4. OpenAI returns modified table structure
5. TableTalk shows preview and posts to Slack upon user confirmation
6. No data is permanently stored by TableTalk

## Data Retention by Sub-Processors

### OpenAI
- OpenAI retains API request data in accordance with their data retention policies
- As of January 2025, OpenAI does not use API data to train models (per their API terms)
- Refer to OpenAI's privacy policy for current retention practices

### Railway
- Railway retains infrastructure logs for operational purposes
- Application-level logs (created by TableTalk) are retained for 30 days
- Refer to Railway's privacy policy for infrastructure data retention

## User Rights

You have the right to:
- Request information about how sub-processors handle your data
- Access sub-processor privacy policies and terms
- Remove TableTalk from your workspace at any time
- Request deletion of logs by contacting support

## Changes to Sub-Processors

We will notify users of any material changes to our sub-processors through:
- Updates to this document with revised "Last Updated" date
- Updates to our Privacy Policy
- Email notifications for significant changes (if applicable)

Users can monitor changes to this document at:
https://github.com/preetrajdeo/tabletalk/blob/main/docs/SUB_PROCESSORS.md

## Additional Information

For more information about how TableTalk handles your data, please refer to:
- **Privacy Policy:** https://github.com/preetrajdeo/tabletalk/blob/main/docs/PRIVACY.md
- **Terms of Service:** https://github.com/preetrajdeo/tabletalk/blob/main/docs/TERMS_OF_SERVICE.md
- **Support Documentation:** https://github.com/preetrajdeo/tabletalk/blob/main/docs/SUPPORT.md

## Contact

For questions about our sub-processors or data processing practices:
- **Email:** preetrajdeo@gmail.com
- **GitHub:** https://github.com/preetrajdeo/tabletalk/issues

---

**Note:** This document is subject to change. Please check the "Last Updated" date and review periodically for updates.
