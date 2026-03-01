# How to Use This Bot While Chatting with Friends

## Quick Start Guide

### Step 1: Invite the Bot to Your Server

1. **Go to Discord Developer Portal**
   - Visit: https://discord.com/developers/applications
   - Click on your bot application

2. **Generate Invite Link**
   - Click "OAuth2" in the left menu
   - Click "URL Generator"
   - Under **Scopes**, select:
     - ✅ `bot`
     - ✅ `applications.commands`
   - Under **Bot Permissions**, select:
     - ✅ Send Messages
     - ✅ Manage Messages
     - ✅ Embed Links
     - ✅ Read Message History
     - ✅ Use Slash Commands
     - ✅ Connect (for voice/music)
     - ✅ Speak (for voice/music)
     - ✅ Kick Members (optional, for moderation)
     - ✅ Ban Members (optional, for moderation)

3. **Copy and Open the Link**
   - Copy the generated URL at the bottom
   - Paste it in your browser
   - Select the server where you chat with friends
   - Click "Authorize"

### Step 2: Make Sure Bot is Running

Keep the bot running on your computer:
```bash
npm start
```

Leave this terminal window open while you want to use the bot!

### Step 3: Use Commands While Chatting

In any text channel where you and your friends chat, type `/` and you'll see the bot's commands!

## Fun Commands to Use with Friends

### 🔥 Roast Your Friends
```
/roast @friend
```
The bot will roast your friend with a funny insult!

Example: `/roast @John`
> "🔥 Roasted! @John, You're like Internet Explorer - nobody wants you, but you're still here."

### 😂 Tell Jokes
```
/joke
```
Get a random programming joke to share!

### 🎲 Play Games
```
/coinflip
```
Flip a coin to make decisions!

```
/roll sides:20
```
Roll dice (great for D&D or random choices)

### 📊 Create Polls
```
/poll question:Where should we eat? options:Pizza|Burgers|Sushi
```
Create polls for group decisions!

### 🎵 Listen to Music Together
```
/join
```
Bot joins your voice channel

```
/play url:https://youtube.com/watch?v=...
```
Play music for everyone!

```
/skip
```
Skip to next song

```
/queue
```
See what's playing next

### 👤 Check User Info
```
/userinfo @friend
```
See when someone joined, their roles, etc.

### 🎮 Other Fun Commands
- `/ping` - Check bot speed
- `/sum numbers:1 2 3 4 5` - Quick math
- `/serverinfo` - Server stats

## Example Conversation

**You:** "Hey guys, check this out!"
**You:** `/roast @Mike`
**Bot:** 🔥 Roasted! @Mike, You're like a software update - whenever I see you, I think 'not now'.

**Mike:** "Oh really? 😂"
**Mike:** `/roast @You`
**Bot:** 🔥 Roasted! @You, I'd challenge you to a battle of wits, but I see you came unarmed.

**Friend:** "Let's decide where to eat!"
**Friend:** `/poll question:Lunch spot? options:McDonald's|Subway|KFC`
**Bot:** 📊 Poll created with reactions!

**You:** "Let's listen to some music while we chat"
**You:** `/join`
**Bot:** 🎵 Joined Voice Channel
**You:** `/play url:https://youtube.com/watch?v=dQw4w9WgXcQ`
**Bot:** ✅ Added to Queue: Never Gonna Give You Up

## Tips for Using with Friends

1. **Keep Bot Running**: The bot only works when `npm start` is running on your computer
2. **Bot Must Be in Server**: Invite the bot to your Discord server first
3. **Commands Work Anywhere**: Use commands in any channel the bot can see
4. **Have Fun**: The roast command is meant to be funny, not mean!
5. **Music in Voice**: Join a voice channel first, then use `/join` and `/play`

## Moderation Commands (If You're Admin)

If you're a server admin/moderator:
- `/kick @user reason:spam` - Kick troublemakers
- `/ban @user reason:harassment` - Ban users
- `/clear amount:10` - Delete multiple messages

## Troubleshooting

**Commands not showing up?**
- Wait 5-10 minutes after inviting the bot
- Make sure bot has "Use Application Commands" permission
- Try typing the full command like `/help`

**Bot is offline?**
- Check if `npm start` is still running
- Restart the bot if needed

**Music not working?**
- Join a voice channel first
- Make sure bot has Connect and Speak permissions
- Use valid YouTube URLs

## Keeping Bot Online 24/7

If you want the bot to stay online even when you close your computer:

**Option 1: Use a VPS/Cloud Server**
- Deploy to services like Heroku, Railway, or DigitalOcean
- Bot stays online 24/7

**Option 2: Use Your Computer with PM2**
```bash
npm install -g pm2
pm2 start index.js --name discord-bot
pm2 save
```
Bot will restart automatically if it crashes!

---

Have fun chatting with your friends! 🎉
