# Privacy Policy for TableTalk

**Last Updated:** January 2025

## Overview

TableTalk is a Slack application that helps users create and edit tables using natural language and AI assistance. This privacy policy explains how we collect, use, and protect your information.

## Information We Collect

### 1. Slack Workspace Information
- Workspace ID
- Channel IDs where the app is used
- User IDs who interact with the app

### 2. User Input
- Table creation commands and descriptions
- Table editing requests
- Content you choose to include in tables

### 3. Technical Data
- API request logs (for debugging and improvement)
- Error logs and performance metrics

## How We Use Your Information

We use the collected information to:
- Process your table creation and editing requests
- Improve AI accuracy and response quality
- Debug technical issues
- Monitor service performance and uptime

## Data Storage and Security

- **AI Processing**: Your table descriptions are sent to OpenAI's API for processing. OpenAI's privacy policy applies to this data processing. Learn more at: https://openai.com/privacy
- **Logs**: We store minimal logs on Railway.app infrastructure for debugging purposes
- **No Long-term Storage**: We do not permanently store your table data or conversation history
- **Ephemeral Processing**: Table data is processed in memory and discarded after delivery

## Data Sharing

We do **NOT**:
- Sell your data to third parties
- Share your data with advertisers
- Use your data for marketing purposes

We **DO** share data with:
- **OpenAI**: For AI-powered table parsing and editing (required for core functionality)
- **Slack**: For delivering responses to your workspace (required for app functionality)

## Your Rights

You have the right to:
- Remove the app from your Slack workspace at any time
- Request deletion of any stored logs (contact support)
- Access information about how your data is processed

## Data Retention

- **Active Processing**: Data is held temporarily during request processing (seconds)
- **Logs**: Error and access logs are retained for 30 days for debugging
- **No User Data**: We do not retain your table content beyond processing

## LLM-Specific Data Policies

TableTalk uses OpenAI's API (GPT-4o-mini) to process user input. The following policies apply to data sent to OpenAI:

### LLM Retention Settings

User prompts (table descriptions and edit instructions) sent to OpenAI are **not retained by TableTalk** beyond the duration of a single request. OpenAI's data retention policies govern how OpenAI handles API inputs. As of the time of this writing, OpenAI does not use API data to train models by default (see [OpenAI API data usage policies](https://openai.com/policies/api-data-usage-policies)). TableTalk does not store, cache, or log the content of user prompts sent to OpenAI.

### LLM Data Tenancy

TableTalk operates as a single-tenant service — each request to OpenAI is made independently on behalf of the individual user initiating the request. User data is not pooled, aggregated, or shared across workspaces. No user's data is commingled with another user's data in LLM processing.

### LLM Data Residency

Data sent to OpenAI for processing is handled according to OpenAI's infrastructure policies. OpenAI primarily processes data in the United States. TableTalk does not have the ability to restrict or specify the geographic region in which OpenAI processes API requests. If your organization has strict data residency requirements, please review [OpenAI's privacy policy](https://openai.com/privacy) before using TableTalk. TableTalk itself is hosted on Railway.app infrastructure, which operates in the United States.

## Children's Privacy

TableTalk is not intended for users under the age of 13. We do not knowingly collect information from children.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify users of any material changes by updating the "Last Updated" date at the top of this policy.

## Third-Party Services

TableTalk uses the following third-party services:
- **OpenAI API**: For AI-powered natural language processing
- **Railway.app**: For hosting and infrastructure
- **Slack API**: For workspace integration

Each service has its own privacy policy:
- OpenAI: https://openai.com/privacy
- Railway: https://railway.app/legal/privacy
- Slack: https://slack.com/privacy-policy

## Contact Us

If you have questions about this privacy policy or how we handle your data, please contact us:

- **Email**: preetrajdeo@gmail.com
- **GitHub**: https://github.com/preetrajdeo/tabletalk/issues
- **Support Page**: https://github.com/preetrajdeo/tabletalk

## Compliance

TableTalk complies with:
- Slack's API Terms of Service
- OpenAI's Usage Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

## Your Consent

By using TableTalk, you consent to this privacy policy and the processing of your data as described herein.
