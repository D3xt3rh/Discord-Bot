# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Bot Token

Choose ONE of these methods:

#### Method A: Using .env file (Recommended)
```bash
cp .env.example .env
```
Then edit `.env` and replace `YOUR_BOT_TOKEN_HERE` with your actual Discord bot token:
```
BOT_TOKEN=your_actual_bot_token_here
```

#### Method B: Using config.json
```bash
cp config.example.json config.json
```
Then edit `config.json` and replace `YOUR_BOT_TOKEN_HERE` with your actual Discord bot token:
```json
{
    "BOT_TOKEN": "your_actual_bot_token_here"
}
```

### 3. Get Your Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Go to "Bot" section
4. Click "Reset Token" or "Copy" to get your bot token
5. Paste it in your `.env` or `config.json` file

### 4. Configure Bot Permissions

In the Discord Developer Portal:
1. Go to "Bot" section
2. Enable these Privileged Gateway Intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
3. Go to "OAuth2" > "URL Generator"
4. Select scopes: `bot`, `applications.commands`
5. Select permissions:
   - Send Messages
   - Manage Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
   - Connect (for voice)
   - Speak (for voice)
   - Kick Members
   - Ban Members
6. Copy the generated URL and invite bot to your server

### 5. Run the Bot
```bash
npm start
```

You should see:
```
[timestamp] INFO: Logged in as YourBot#1234!
[timestamp] INFO: Slash commands registered successfully.
```

## Troubleshooting

### "BOT_TOKEN not found" Error
- Make sure you created either `.env` or `config.json` file
- Check that the token is on the correct line without extra spaces
- Verify the token is valid in Discord Developer Portal

### Commands Not Showing Up
- Wait a few minutes for Discord to sync commands
- Make sure bot has `applications.commands` scope
- Try kicking and re-inviting the bot

### Music Not Working
- Ensure bot has Connect and Speak permissions
- Join a voice channel before using `/join`
- Make sure the YouTube URL is valid and accessible

### Permission Errors
- Check bot role is high enough in server role hierarchy
- Verify bot has required permissions in channel
- Ensure you have the necessary permissions to use moderation commands

## Security Notes

### NPM Audit Warnings
The project shows moderate vulnerabilities in `undici` (dependency of discord.js). These are:
- Related to decompression chain in HTTP responses
- Fixed in discord.js v15 (currently in development)
- Low risk for typical bot usage (doesn't handle untrusted HTTP responses)

**Recommendation**: Monitor for discord.js updates and upgrade when v15 is stable.

**DO NOT** run `npm audit fix --force` as it will downgrade to discord.js v13 and break the code.

### Protecting Your Token
- Never commit `.env` or `config.json` to git (already in .gitignore)
- Never share your bot token publicly
- Regenerate token immediately if exposed
- Use environment variables in production

## Production Deployment

For production environments:
1. Use environment variables instead of config files
2. Set up process manager (PM2, systemd)
3. Enable logging to files
4. Monitor bot uptime and errors
5. Keep dependencies updated

Example PM2 setup:
```bash
npm install -g pm2
pm2 start index.js --name discord-bot
pm2 save
pm2 startup
```
