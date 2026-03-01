# Discord-Bot

An advanced Discord bot with slash commands, moderation, fun features, and music playback.

## Features

### 🔧 Utility Commands
- **ping** - Check bot latency, API ping, and uptime
- **sum** - Sum numbers with validation
- **userinfo** - Detailed user information with roles and join dates
- **serverinfo** - Complete server statistics and information
- **help** - Beautiful embed showing all commands

### 🛡️ Moderation Commands
- **kick** - Kick users with role hierarchy checks
- **ban** - Ban users with proper permission validation
- **clear** - Bulk delete messages (1-100)

### 🎮 Fun Commands
- **joke** - Random programming jokes
- **coinflip** - Flip a coin
- **roll** - Roll dice with custom sides (2-100)
- **poll** - Create interactive polls with reactions

### 🎵 Music Commands
- **join** - Join your voice channel
- **play** - Play YouTube songs with queue support
- **pause/resume** - Control playback
- **skip** - Skip current song
- **nowplaying** - Show current song info
- **queue** - Display music queue (up to 50 songs)
- **leave** - Disconnect from voice

### ✨ Enhanced Features
- Beautiful embed responses for all commands
- Cooldown system (3s) to prevent spam
- Comprehensive error handling and logging
- Role hierarchy validation for moderation
- Input validation for all commands
- Rotating bot status
- Environment variable support
- Queue limit protection (50 songs max)
- Automatic cleanup on errors

## Setup

**Quick Setup:**
1. `npm install`
2. Copy `.env.example` to `.env` and add your bot token
3. `npm start`

**Detailed instructions:** See [SETUP.md](SETUP.md) for complete setup guide including:
- Getting your bot token
- Configuring permissions
- Troubleshooting
- Production deployment

## Bot Permissions

Required in Discord Developer Portal (Bot section):
- Send Messages, Read Messages, Use Slash Commands
- Kick Members, Ban Members (for moderation)
- Connect, Speak (for music)
- Message Content Intent, Server Members Intent enabled

## Usage

Use `/` in Discord to see all slash commands. Examples:
- `/ping` - Check bot status
- `/sum numbers:1 2 3 4 5` - Calculate sum
- `/userinfo user:@someone` - Get user info
- `/kick user:@user reason:spam` - Kick a user
- `/poll question:Favorite color? options:Red|Blue|Green` - Create poll
- `/roll sides:20` - Roll a 20-sided die
- `/join` then `/play url:https://youtube.com/watch?v=...` - Play music

## Technical Features

- Cooldown system prevents command spam
- Role hierarchy validation for moderation
- Comprehensive error handling and logging
- Input validation on all commands
- Queue management with 50 song limit
- Automatic cleanup on disconnection
- Beautiful embed responses
- Rotating bot status

## Dependencies

- **discord.js** - Discord API wrapper
- **@discordjs/voice** - Voice connection handling
- **play-dl** - YouTube audio streaming
- **ffmpeg-static** - Audio processing
- **dotenv** - Environment variable management

**Note:** NPM audit shows moderate vulnerabilities in `undici` (discord.js dependency). These are fixed in discord.js v15 (in development). Current risk is low for typical bot usage. Do not run `npm audit fix --force` as it will break the code.
