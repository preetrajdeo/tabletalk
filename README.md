# TableTalk — AI-Powered Tables for Slack

> Slack is where decisions happen. But structured data lives elsewhere.
> TableTalk brings tables into the conversation.

## The Problem

Slack is where teams align — but the moment a discussion requires structured data,
people paste screenshots from Google Sheets or format messy text blocks. The
context breaks. The meeting drags. The table gets updated in a separate doc nobody
checks.

The pain is sharpest for PMs and ops teams who live in Slack: sprint planning,
vendor comparisons, roadmap prioritization. All of it requires tables. None of it
belongs in a spreadsheet tab.

## The Solution

A `/table` slash command that generates and edits formatted tables using plain
English — directly in Slack, without leaving the conversation.

Users describe what they want ("Compare 5 cloud providers with pricing and SLA"),
preview the result privately, and post when ready. They can edit with natural
language ("Add a column for compliance certifications") in the same flow.

## Product Decisions & Tradeoffs

**Ephemeral preview before posting** — I chose to show tables privately before
they go public. This added implementation complexity but was the right call:
users won't trust a tool that posts wrong output to a whole channel. Trust
requires a preview step.

**GPT-4o-mini over GPT-4o** — Table generation doesn't require frontier
reasoning. 4o-mini generates accurate table structures at ~100x lower cost.
The tradeoff was occasional misinterpretation of ambiguous prompts, which I
mitigated with a fallback to manual editing mode.

**Mastra as the agent framework** — Chose Mastra over a custom LangChain setup
for faster iteration. Tradeoff: less control over the agent loop, but shipping
faster mattered more at this stage than perfect architecture.

**No persistent storage** — Tables are ephemeral by design. I deliberately chose
not to store user inputs, which simplified compliance and privacy. A future
version could offer opt-in logging for teams that want table history.

## What I Learned

Parsing user intent is the hardest part — not generating the table. "Create a
table for my team" is ambiguous in ways that only surface when real users type
it. I learned to prompt for structured output with explicit fallback handling,
and to design the manual editing flow as the primary recovery path, not an
afterthought.

The cost analysis also shaped product thinking: at ~$0.0001 per table operation
and $5/month hosting, the unit economics work at scale. Understanding the cost
floor informed decisions about how aggressively to optimize the AI calls.

## Status

Live in production · tabletalk-production.up.railway.app · Pending Slack App Directory review

**Stack**: Node.js · Mastra · OpenAI GPT-4o-mini · Slack Web API · Railway

---

## Technical Documentation

**AI-Powered Table Creation for Slack**

Create and edit tables in Slack using natural language. Transform ideas into formatted tables instantly with `/table`.

[![Live on Railway](https://img.shields.io/badge/Live%20on-Railway-blueviolet)](https://tabletalk-production.up.railway.app)
[![GitHub](https://img.shields.io/github/license/preetrajdeo/tabletalk)](LICENSE)

## Features

- 🤖 **AI-Powered Generation**: Describe your table in plain English
- ✏️ **Intelligent Editing**: Modify tables with natural language commands
- 👀 **Preview Mode**: See changes privately before posting
- 📝 **Manual Control**: Switch to hands-on editing anytime
- ⚡ **Lightning Fast**: Tables generate in seconds
- 🔒 **Privacy-Focused**: No permanent data storage

## Quick Start

### Installation

1. Visit the Slack App Directory (coming soon) or install to your workspace
2. Authorize the required permissions
3. Start using `/table` in any channel!

### Basic Usage

**Create a table:**
```
/table Create a table with 3 programming languages and their use cases
```

**Edit with AI:**
1. Click "✏️ Edit" on any table
2. Choose "🤖 Edit with AI"
3. Describe your changes: "Add a column for difficulty level"
4. Preview and post when ready

## Examples

```
/table Sprint planning with tasks, assignees, and story points
/table Compare 5 cloud providers with pricing and features
/table Weekly team schedule with availability
/table API endpoints with method, path, and description
```

## Documentation

- **[Support & User Guide](docs/SUPPORT.md)** - Complete usage documentation
- **[Privacy Policy](docs/PRIVACY.md)** - How we handle your data
- **[App Descriptions](docs/APP_DESCRIPTIONS.md)** - Marketing materials

## Technical Stack

- **Framework**: [Mastra](https://mastra.ai) - AI agent framework
- **AI Model**: OpenAI GPT-4o-mini
- **Hosting**: Railway.app
- **Integration**: Slack Web API

## Development

### Prerequisites

- Node.js >= 20.9.0
- Slack App credentials
- OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/preetrajdeo/tabletalk.git
   cd tabletalk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   SLACK_BOT_TOKEN=xoxb-your-token
   OPENAI_API_KEY=sk-your-key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Use ngrok for local testing:
   ```bash
   ngrok http 5001
   ```

6. Update Slack app URLs with your ngrok URL

### Project Structure

```
tabletalk/
├── src/
│   └── mastra/
│       ├── index.ts                 # Main Mastra configuration
│       ├── slackTableCommands.ts    # Core table logic
│       ├── aiTableParser.ts         # OpenAI integration
│       ├── slackClient.ts           # Slack API client
│       └── tableUtils.ts            # Utility functions
├── docs/
│   ├── PRIVACY.md                   # Privacy policy
│   ├── SUPPORT.md                   # User documentation
│   └── APP_DESCRIPTIONS.md          # Marketing copy
├── package.json
└── .env (create this)
```

### Building for Production

```bash
npm run build
```

The build output will be in `.mastra/output/`.

### Deployment

Deploy to Railway:
```bash
# Push to GitHub
git push origin main

# Deploy from Railway dashboard
# Set environment variables in Railway
# Generate public domain
```

See full deployment guide in [SETUP.md](SETUP.md).

## Architecture

### Key Components

- **Slash Command Handler** (`/slack/commands`): Receives `/table` commands
- **Interaction Handler** (`/slack/interactions`): Handles button clicks and modal submissions
- **AI Parser**: Converts natural language to table structures
- **Table Formatter**: Generates markdown-formatted tables
- **Ephemeral Preview**: Shows edits privately before posting

### Data Flow

1. User types `/table description`
2. OpenAI parses description into structured data
3. Table formatter creates markdown
4. Slack posts table with action buttons
5. User clicks "Edit with AI"
6. AI processes edit request
7. Preview shown ephemerally
8. User clicks "Post to Channel"
9. Table posted publicly

## API Endpoints

- `POST /slack/commands` - Slash command endpoint
- `POST /slack/interactions` - Interactive component endpoint
- `POST /api/inngest` - Inngest workflow registration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SLACK_BOT_TOKEN` | Slack Bot User OAuth Token | Yes |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Cost Analysis

- **Hosting**: ~$5/month (Railway.app)
- **OpenAI API**: ~$0.0001 per table operation
- **Total**: ~$5/month for unlimited users

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/preetrajdeo/tabletalk/issues)
- **Email**: preetrajdeo@gmail.com
- **Documentation**: [SUPPORT.md](docs/SUPPORT.md)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Mastra](https://mastra.ai)
- Powered by [OpenAI](https://openai.com)
- Hosted on [Railway](https://railway.app)
- Integrated with [Slack](https://slack.com)

## Roadmap

- [ ] Multi-language support
- [ ] Custom table templates
- [ ] Table export (CSV, JSON)
- [ ] Scheduled table updates
- [ ] Integration with Google Sheets
- [ ] Table versioning/history
- [ ] Advanced formatting options
- [ ] Team analytics dashboard

---

Made with ❤️ by [Preet Rajdeo](https://github.com/preetrajdeo)
