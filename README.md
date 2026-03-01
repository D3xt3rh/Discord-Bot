# Discord-Bot

An advanced Discord bot with slash commands, moderation, fun features, and music playback.

## Features

- **Ping**: Check bot latency
- **Sum**: Sum provided numbers
- **Help**: Display available commands
- **Kick/Ban**: Moderation commands with permissions
- **Joke/Coinflip**: Fun random commands
- **Music**: Join voice, play YouTube songs, queue, skip, leave
- All commands use modern slash commands for better UX

## Setup

1. Clone or download the repository.
2. Install dependencies: `npm install`
3. Update `config.json` with your bot token.
4. Run the bot: `npm start`

## Bot Permissions

Required in Discord Developer Portal (Bot section):
- Send Messages, Read Messages, Use Slash Commands
- Kick Members, Ban Members (for moderation)
- Connect, Speak (for music)
- Message Content Intent, Server Members Intent enabled

## Usage

Use `/` in Discord to see slash commands. Examples:
- `/ping`
- `/sum numbers:1 2 3`
- `/kick user:@user reason:spam`
- `/join` then `/play url:https://youtube.com/watch?v=...`

For music, bot needs voice permissions and ffmpeg installed (included via ffmpeg-static).

## Dependencies

Added for advanced features:
- @discordjs/voice, play-dl for music
- ffmpeg-static for audio processing
