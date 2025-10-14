# TableTalk Setup Guide

## Overview

TableTalk allows you to create and edit beautiful tables directly in Slack using the `/table` command.

## Features

- ✅ Create tables with interactive modal
- ✅ Edit existing tables
- ✅ Add/remove rows and columns
- ✅ Copy-paste tables between channels
- ✅ Clean markdown formatting
- 🚧 AI-powered editing (coming soon)

## Slack App Configuration

### Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "TableTalk" and select your workspace

### Step 2: Configure Slash Commands

1. In your app settings, go to **Slash Commands**
2. Click "Create New Command"
3. Configure the `/table` command:
   - **Command**: `/table`
   - **Request URL**: `https://your-deployment-url.com/slack/commands`
   - **Short Description**: `Create a table`
   - **Usage Hint**: `[headers, rows] or leave empty for modal`

### Step 3: Enable Interactivity

1. Go to **Interactivity & Shortcuts**
2. Turn on **Interactivity**
3. Set **Request URL** to: `https://your-deployment-url.com/slack/interactions`

### Step 4: Add Bot Scopes

1. Go to **OAuth & Permissions**
2. Add the following **Bot Token Scopes**:
   - `chat:write` - Post messages
   - `chat:write.public` - Post to channels without joining
   - `commands` - Use slash commands
   - `users:read` - Get user info

### Step 5: Install to Workspace

1. Go to **Install App**
2. Click "Install to Workspace"
3. Authorize the app

### Step 6: Configure Environment

Your Slack connection should already be configured in Mastra. The app will use the existing Slack integration.

## Usage

### Basic Usage

#### Open Modal (Interactive)
```
/table
```
Opens a modal where you can enter:
- **Column Headers**: Name, Status, Owner
- **Table Rows**: One row per line, comma or pipe-separated

#### Quick Create (Text)
```
/table Name, Status, Owner
Project A, Active, John
Project B, Pending, Sarah
```

### Editing Tables

After creating a table, you'll see action buttons:
- **✏️ Edit**: Opens modal to edit the entire table
- **➕ Add Row**: Adds an empty row and opens edit modal
- **➕ Add Column**: Adds an empty column and opens edit modal

**Note**: Only the creator of a table can edit it.

### Example Output

When you create a table, it will appear like this in Slack:

\`\`\`
*Name*       | *Status*  | *Owner*
------------ | --------- | -------
Project A    | Active    | John
Project B    | Pending   | Sarah
Project C    | Complete  | Mike
\`\`\`

## Development

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Use a tool like ngrok to expose your local server:
```bash
ngrok http 5000
```

4. Update your Slack app's Request URLs to use the ngrok URL

### File Structure

```
src/
├── mastra/
│   ├── tableUtils.ts           # Table data structures and formatters
│   ├── slackTableCommands.ts   # Slack command handlers
│   └── index.ts                # Main Mastra configuration
└── triggers/
    └── slackTriggers.ts        # Existing Slack integration
```

### Key Functions

**tableUtils.ts**:
- `formatTableAsMarkdown()` - Converts table to Slack markdown
- `createEmptyTable()` - Creates blank table with dimensions
- `parseTableFromText()` - Parses comma/pipe-separated text
- `addRow()`, `addColumn()`, `removeRow()`, `removeColumn()` - Table mutations

**slackTableCommands.ts**:
- `handleTableCommand()` - Processes `/table` slash command
- `openTableModal()` - Shows interactive modal
- `handleModalSubmission()` - Processes modal form data
- `postTable()` - Posts formatted table to Slack
- `handleTableAction()` - Handles edit/add buttons

## Deployment

The app is configured to deploy to Google Cloud Run via Replit.

### Replit Deployment

1. Your `.replit` file is already configured
2. Click the "Deploy" button in Replit
3. Copy the deployment URL
4. Update your Slack app's Request URLs with the new URL

### Environment Variables

Make sure these are set in your Replit environment:
- Slack OAuth token (already configured via Mastra)
- PostgreSQL connection (for future persistence)

## Troubleshooting

### Slash Command Not Working

1. Check that your Request URL is correct in Slack app settings
2. Verify the app is running and accessible
3. Check logs for errors: `mastra dev` output

### Modal Not Opening

1. Ensure Interactivity is enabled in Slack app settings
2. Check that the Interactions Request URL is correct
3. Verify the `trigger_id` is being passed correctly

### Table Not Formatting Correctly

1. Check that you're using code blocks (triple backticks)
2. Verify headers and rows are properly aligned
3. Test with simpler data first

### Button Actions Not Working

1. Ensure the interactions endpoint is receiving requests
2. Check that the user ID matches the creator
3. Verify the table data is being serialized/deserialized correctly

## Future Enhancements

### AI-Powered Editing (Planned)

We'll add natural language commands like:
- "Add a column for deadline"
- "Remove the second row"
- "Sort by status"
- "Bold the headers"

This will use Mastra's AI agent capabilities to interpret commands and modify tables.

### Persistence (Planned)

Currently, tables only exist in Slack messages. Future versions will:
- Store tables in PostgreSQL
- Allow retrieving past tables
- Enable table templates
- Support versioning/history

## API Endpoints

### POST /slack/commands

Handles slash commands.

**Request Body** (from Slack):
```
command=/table
text=Name, Status
user_id=U123456
channel_id=C123456
trigger_id=12345.67890.abcdef
```

### POST /slack/interactions

Handles interactive components (modals, buttons).

**Request Body** (from Slack):
```
payload={
  "type": "view_submission",
  "view": { ... },
  "user": { ... }
}
```

## Support

For issues or questions:
1. Check the logs in Replit console
2. Review Slack API documentation
3. Test with simple examples first

## License

MIT
