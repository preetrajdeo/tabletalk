# TableTalk Support & Documentation

Welcome to TableTalk! This guide will help you get started and troubleshoot common issues.

## Quick Start

### Installation
1. Visit the [Slack App Directory](#) (or install from your workspace admin)
2. Click "Add to Slack"
3. Authorize the required permissions
4. Start using `/table` in any channel!

### Basic Usage

#### Creating a Table
Simply type `/table` followed by your description:

```
/table Create a table with 3 programming languages and their use cases
```

TableTalk will generate a formatted table based on your description.

#### Editing a Table
After creating a table, you'll see buttons to:
- **✏️ Edit** - Modify the table using AI or manually
- **🔄 Regenerate** - Create a new version
- **❌ Delete** - Remove the table

### AI-Powered Editing

1. Click **"✏️ Edit"** on any table
2. Choose **"🤖 Edit with AI"**
3. Describe your changes in natural language:
   ```
   Add a fourth column for "Difficulty Level"
   ```
4. Preview the edited table (only visible to you)
5. Click **"📤 Post to Channel"** to share with everyone

### Manual Editing

1. Click **"✏️ Edit"** on any table
2. Choose **"📝 Edit Manually"**
3. Fill in the form with:
   - Table title
   - Column headers (comma-separated)
   - Rows (one per line, comma-separated values)
4. Submit to update the table

## Common Use Cases

### Project Management
```
/table Create a sprint planning table with tasks, assignees, and status
```

### Data Comparison
```
/table Compare cloud providers with pricing, features, and regions
```

### Meeting Notes
```
/table Action items table with owner, task, deadline, and status
```

### Documentation
```
/table API endpoints with method, path, and description
```

## Troubleshooting

### `/table` command not working

**Possible causes:**
- App not installed in your workspace
- Missing permissions
- Command endpoint configuration issue

**Solutions:**
1. Check if TableTalk is installed: Go to Slack → Apps → Manage
2. Reinstall the app if needed
3. Contact your workspace admin to verify permissions
4. Contact support if issue persists

### Table not generating correctly

**Possible causes:**
- Unclear or ambiguous description
- Complex table structure
- OpenAI API temporary issue

**Solutions:**
1. Try rephrasing your description more clearly
2. Break complex tables into simpler structures
3. Use the manual editing option
4. Try again in a few moments

### AI editing not applying changes

**Possible causes:**
- Unclear edit instructions
- Requested changes too complex

**Solutions:**
1. Be more specific in your edit request
2. Try breaking changes into smaller edits
3. Use manual editing for precise control

### "Post to Channel" button not working

**Possible causes:**
- Permission issues
- Channel restrictions

**Solutions:**
1. Check that the bot has permission to post in the channel
2. Try in a different channel
3. Contact your workspace admin

## Features

### ✅ What TableTalk Can Do
- Create tables from natural language descriptions
- Edit existing tables with AI assistance
- Preview changes before posting
- Manual editing for precise control
- Support for any channel or DM
- Markdown-formatted tables
- Regenerate tables for different layouts

### ❌ Current Limitations
- Maximum table size: ~20 columns x 50 rows (for readability)
- English language support only (currently)
- Requires internet connection
- Subject to OpenAI API rate limits

## Privacy & Security

- We do not store your table data permanently
- All processing is ephemeral (in-memory only)
- Your data is processed through OpenAI's API
- See our full [Privacy Policy](PRIVACY.md)

## Frequently Asked Questions

### Is TableTalk free?
Yes! TableTalk is currently free to use for all workspaces.

### Does TableTalk work in DMs?
Yes, you can use `/table` in direct messages.

### Can I export tables?
Tables are created as plain text in Slack, so you can copy/paste them anywhere.

### How accurate is the AI?
TableTalk uses OpenAI's GPT-4o-mini, which is highly accurate. However, always review generated content for accuracy.

### Can I use TableTalk in private channels?
Yes, as long as the app is added to that channel.

### What data does TableTalk collect?
We collect minimal data needed for functionality. See our [Privacy Policy](PRIVACY.md) for details.

## Getting Help

### Support Channels

**GitHub Issues** (recommended for bug reports):
https://github.com/preetrajdeo/tabletalk/issues

**Email Support**:
preetrajdeo@gmail.com

**Response Time**:
- Critical issues: Within 24 hours
- General inquiries: Within 48 hours

### Bug Reports

When reporting bugs, please include:
1. Description of the issue
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Slack workspace name (optional)

### Feature Requests

We welcome feature requests! Please submit them as GitHub issues with the label "enhancement".

## Updates & Changelog

### Version 1.0.0 (January 2025)
- Initial release
- AI-powered table creation
- Natural language editing
- Ephemeral preview feature
- Manual editing option
- Multi-channel support

## Additional Resources

- **GitHub Repository**: https://github.com/preetrajdeo/tabletalk
- **Privacy Policy**: [PRIVACY.md](PRIVACY.md)
- **Slack API Docs**: https://api.slack.com/

## Tips & Best Practices

### Writing Good Table Descriptions

**Good examples:**
- "Create a table with 3 employees and their departments, roles, and start dates"
- "Make a comparison table of 5 smartphones with brand, price, and rating"

**Less effective:**
- "Make a table" (too vague)
- "Complex nested hierarchical data structure" (too complex)

### Editing Tables Efficiently

1. Start with AI generation for quick setup
2. Use AI editing for structural changes
3. Use manual editing for precise data updates
4. Preview before posting to avoid mistakes

### Keyboard Shortcuts

Slack's standard keyboard shortcuts work:
- `/` - Open slash command menu
- `Esc` - Close modals
- `Tab` - Navigate form fields

## Terms of Service

By using TableTalk, you agree to:
- Use the service responsibly
- Not abuse or spam the service
- Follow Slack's Terms of Service
- Comply with your organization's policies

## Acknowledgments

TableTalk is powered by:
- OpenAI GPT-4o-mini
- Mastra Framework
- Slack API
- Railway.app hosting

---

**Need more help?** Open an issue on GitHub or email us at preetrajdeo@gmail.com
