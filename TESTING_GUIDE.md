# TableTalk Testing Guide

## Quick Start Testing

### Prerequisites

1. **Install dependencies** (run in terminal):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   cd /Users/preetrajdeo/Desktop/TableTalk
   npm install
   ```

2. **Check if it's already deployed on Replit**:
   - This project appears to be a Replit project (has `.replit` file)
   - It might already be running on Replit!
   - Check your Replit dashboard for this project

## Option 1: Test on Replit (Easiest)

If this is already deployed on Replit:

1. **Open Replit Dashboard**: Go to replit.com
2. **Find TableTalk project**: Look for this project in your workspace
3. **Click "Run"**: The project should start automatically
4. **Get the URL**: Replit will show you a URL like `https://tabletalk-xyz.replit.app`
5. **Skip to "Configure Slack App"** below

## Option 2: Test Locally with ngrok

If you want to test locally:

### Step 1: Start the Server

```bash
cd /Users/preetrajdeo/Desktop/TableTalk
npm run dev
```

You should see:
```
✓ Server running on http://0.0.0.0:5000
```

### Step 2: Expose with ngrok

In a **new terminal window**:

```bash
# Install ngrok if you don't have it
brew install ngrok

# Or download from https://ngrok.com/download

# Start ngrok
ngrok http 5000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:5000
```

**Copy that https URL** (e.g., `https://abc123.ngrok.io`)

## Configure Slack App

### Step 1: Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name: `TableTalk`
4. Choose your workspace
5. Click **"Create App"**

### Step 2: Add Slash Command

1. In left sidebar, click **"Slash Commands"**
2. Click **"Create New Command"**
3. Fill in:
   - **Command**: `/table`
   - **Request URL**: `YOUR_URL/slack/commands`
     - If Replit: `https://your-replit-url.replit.app/slack/commands`
     - If ngrok: `https://abc123.ngrok.io/slack/commands`
   - **Short Description**: `Create a table`
   - **Usage Hint**: `[optional: headers, rows]`
4. Click **"Save"**

### Step 3: Enable Interactivity

1. In left sidebar, click **"Interactivity & Shortcuts"**
2. Toggle **"Interactivity"** to **ON**
3. **Request URL**: `YOUR_URL/slack/interactions`
   - If Replit: `https://your-replit-url.replit.app/slack/interactions`
   - If ngrok: `https://abc123.ngrok.io/slack/interactions`
4. Click **"Save Changes"**

### Step 4: Add Bot Scopes

1. In left sidebar, click **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Click **"Add an OAuth Scope"** and add:
   - `chat:write`
   - `chat:write.public`
   - `commands`
   - `users:read`

### Step 5: Install to Workspace

1. In left sidebar, click **"Install App"**
2. Click **"Install to Workspace"**
3. Review permissions and click **"Allow"**
4. **Copy the "Bot User OAuth Token"** (starts with `xoxb-`)

### Step 6: Configure Mastra Connection

The app needs to connect to Slack. Check if you already have Slack configured in Mastra:

1. Look for `.env` file or environment variables
2. You might need to add the bot token somewhere
3. OR the Replit integration might handle this automatically

**If you need help with this step, let me know!**

## Test the /table Command

### Test 1: Basic Modal

1. Go to your Slack workspace
2. In any channel, type:
   ```
   /table
   ```
3. **Expected**: A modal should pop up with two fields:
   - "Column Headers"
   - "Table Rows"

### Test 2: Create a Simple Table

In the modal:
1. **Column Headers**: Enter `Name, Status, Owner`
2. **Table Rows**: Enter:
   ```
   Project A, Active, John
   Project B, Pending, Sarah
   ```
3. Click **"Create"**

**Expected Result**: You should see a formatted table posted in the channel:

```
*Name*       | *Status*  | *Owner*
------------ | --------- | -------
Project A    | Active    | John
Project B    | Pending   | Sarah
```

With three buttons below:
- [✏️ Edit]
- [➕ Add Row]
- [➕ Add Column]

### Test 3: Quick Create (Text Format)

Type in Slack:
```
/table Name, Status
Project A, Active
Project B, Pending
```

**Expected**: Table should be created directly without opening modal

### Test 4: Edit Table

1. Click the **"✏️ Edit"** button on a table you created
2. **Expected**: Modal opens with current data pre-filled
3. Change some values
4. Click **"Update"**
5. **Expected**: Message updates with new table

### Test 5: Add Row

1. Click **"➕ Add Row"** button
2. **Expected**: Modal opens with an additional empty row
3. Fill in the new row
4. Click **"Update"**
5. **Expected**: Table now has the new row

### Test 6: Add Column

1. Click **"➕ Add Column"** button
2. **Expected**: Modal opens with an additional empty column
3. Fill in the new column data
4. Click **"Update"**
5. **Expected**: Table now has the new column

### Test 7: Permission Check

1. Create a table as User A
2. Switch to User B (or ask a colleague)
3. Try to click **"✏️ Edit"** on User A's table
4. **Expected**: Error message saying only creator can edit

### Test 8: Copy/Paste

1. Create a table
2. Try to select the table text with your mouse
3. Copy it (Cmd+C / Ctrl+C)
4. Paste in another channel
5. **Expected**: Table text should be copyable and readable

## Troubleshooting

### ❌ "/table command not found"

**Problem**: Slack doesn't recognize the command

**Solutions**:
1. Check Slash Commands are saved in Slack app settings
2. Make sure you installed the app to workspace
3. Try typing the command again (might take a minute to register)

### ❌ "Modal doesn't open"

**Problem**: Nothing happens when you type `/table`

**Solutions**:
1. Check server is running (`npm run dev` or Replit shows "Running")
2. Check Request URL in Slack app → Slash Commands
3. Look at server logs for errors
4. Test the endpoint directly:
   ```bash
   curl -X POST YOUR_URL/slack/commands
   # Should get a response
   ```

### ❌ "Buttons don't work"

**Problem**: Clicking Edit/Add buttons does nothing

**Solutions**:
1. Check Interactivity is enabled in Slack app
2. Check Request URL for interactions is correct
3. Look at server logs when you click the button
4. Make sure you're the one who created the table

### ❌ "Table formatting looks wrong"

**Problem**: Table doesn't align properly

**Solutions**:
1. Check if you're using code blocks (should have triple backticks)
2. Try with shorter text first
3. Make sure all rows have same number of columns

### ❌ "Error: Slack not connected"

**Problem**: Server can't connect to Slack API

**Solutions**:
1. Check if Slack OAuth token is configured
2. Look for `.env` file or environment variables
3. Check Mastra Slack integration settings
4. Make sure bot token starts with `xoxb-`

## Checking Logs

### Server Logs

When you run `npm run dev`, watch for:
```
[Slack Command] { command: '/table' }
[Slack Interaction] { type: 'view_submission', ... }
```

### Slack API Logs

1. Go to https://api.slack.com/apps
2. Open your TableTalk app
3. Click **"Event Subscriptions"** or **"Slash Commands"**
4. Check for request/response logs

## What Success Looks Like

When everything works, you should be able to:
- ✅ Type `/table` and see a modal
- ✅ Create tables with multiple rows and columns
- ✅ Edit tables by clicking the edit button
- ✅ Add rows and columns dynamically
- ✅ Copy/paste tables to other channels
- ✅ Only creators can edit their tables

## Next Steps After Testing

Once basic functionality works:
1. Deploy to production (if using Replit, just click Deploy)
2. Update Slack app URLs to production endpoint
3. Consider adding AI-powered editing
4. Consider adding database persistence

## Need Help?

If you get stuck:
1. Check `SETUP.md` for detailed configuration
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Look at server logs for error messages
4. Test endpoints with curl to verify they're accessible

Ready to test! 🚀
