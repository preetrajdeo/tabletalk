# TableTalk

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

## Status

✅ **Production Ready** - Live at https://tabletalk-production.up.railway.app

---

Made with ❤️ by [Preet Rajdeo](https://github.com/preetrajdeo)
