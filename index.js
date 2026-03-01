require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play = require('play-dl');
const fs = require('fs');

// Configuration with fallback
const BOT_TOKEN = process.env.BOT_TOKEN || (fs.existsSync('./config.json') ? require('./config.json').BOT_TOKEN : null);

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN not found. Set it in .env file or config.json');
  process.exit(1);
}

// Logger utility
const logger = {
  info: (msg) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`),
  error: (msg, err) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, err || ''),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] WARN: ${msg}`)
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Cooldown system
const cooldowns = new Map();
const COOLDOWN_TIME = 3000; // 3 seconds

// Queue system with limits
const queues = new Map();
const MAX_QUEUE_SIZE = 50;

// Enhanced commands
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and uptime'),
  new SlashCommandBuilder()
    .setName('sum')
    .setDescription('Sum provided numbers')
    .addStringOption(option =>
      option.setName('numbers')
        .setDescription('Numbers to sum, separated by spaces')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands with descriptions'),
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to get info about (leave empty for yourself)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get information about this server'),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for kick')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for ban')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete multiple messages')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Poll question')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('options')
        .setDescription('Poll options separated by | (e.g., Yes|No|Maybe)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice')
    .addIntegerOption(option =>
      option.setName('sides')
        .setDescription('Number of sides on the die (default: 6)')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(100)),
  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke'),
  new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Roast a user with a humorous insult')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to roast (leave empty to roast yourself)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your voice channel'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music from YouTube URL')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('YouTube URL')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
  new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show currently playing song'),
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the music queue'),
  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel'),
];

// Cooldown checker
function checkCooldown(userId, commandName) {
  const key = `${userId}-${commandName}`;
  if (cooldowns.has(key)) {
    const expirationTime = cooldowns.get(key) + COOLDOWN_TIME;
    if (Date.now() < expirationTime) {
      const timeLeft = (expirationTime - Date.now()) / 1000;
      return { onCooldown: true, timeLeft: timeLeft.toFixed(1) };
    }
  }
  cooldowns.set(key, Date.now());
  setTimeout(() => cooldowns.delete(key), COOLDOWN_TIME);
  return { onCooldown: false };
}

// Music player function with error handling
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) {
    if (queue && queue.connection) {
      queue.connection.destroy();
    }
    queues.delete(guildId);
    return;
  }

  const song = queue.songs[0];
  try {
    const stream = await play.stream(song.url, { quality: 2 });
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const player = createAudioPlayer();
    
    player.play(resource);
    queue.connection.subscribe(player);
    queue.player = player;
    queue.isPaused = false;

    player.on(AudioPlayerStatus.Idle, () => {
      queue.songs.shift();
      playSong(guildId);
    });

    player.on('error', error => {
      logger.error('Audio player error:', error);
      queue.songs.shift();
      playSong(guildId);
    });

    logger.info(`Now playing: ${song.title} in guild ${guildId}`);
  } catch (error) {
    logger.error('Error playing song:', error);
    queue.songs.shift();
    playSong(guildId);
  }
}

// Joke collection
const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "What do you call fake spaghetti? An impasta!",
  "Why don't programmers like nature? It has too many bugs!",
  "What's a programmer's favorite hangout place? Foo Bar!",
  "Why do Java developers wear glasses? Because they can't C#!",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
  "Why did the developer go broke? Because he used up all his cache!",
  "What do you call a programmer from Finland? Nerdic!",
  "Why do programmers prefer dark mode? Because light attracts bugs!"
];

// Roast collection
const roasts = [
  "You're like a software update - whenever I see you, I think 'not now'.",
  "I'd explain it to you, but I left my crayons at home.",
  "You're proof that even evolution makes mistakes sometimes.",
  "If you were any more useless, you'd be a semicolon in Python.",
  "You're like Internet Explorer - nobody wants you, but you're still here.",
  "I'd call you a tool, but that would imply you're useful.",
  "You're the human equivalent of a participation trophy.",
  "If brains were dynamite, you wouldn't have enough to blow your nose.",
  "You're like a cloud - when you disappear, it's a beautiful day.",
  "I'd agree with you, but then we'd both be wrong.",
  "You're not stupid; you just have bad luck thinking.",
  "You bring everyone so much joy... when you leave the room.",
  "I'd challenge you to a battle of wits, but I see you came unarmed.",
  "You're like a broken pencil - pointless.",
  "If I wanted to hear from someone with your IQ, I'd watch paint dry.",
  "You're the reason the gene pool needs a lifeguard.",
  "I'd roast you, but my mom said I'm not allowed to burn trash.",
  "You're like a software bug - annoying and nobody knows why you exist.",
  "If you were any slower, you'd be going backwards.",
  "You're living proof that not all code should be executed."
];

// Bot ready event
client.once('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  
  try {
    await client.application.commands.set(commands);
    logger.info('Slash commands registered successfully.');
  } catch (error) {
    logger.error('Failed to register commands:', error);
  }

  // Set rotating status
  const statuses = [
    { name: '/help for commands', type: ActivityType.Playing },
    { name: 'music 🎵', type: ActivityType.Listening },
    { name: 'over the server', type: ActivityType.Watching },
    { name: 'with Discord.js', type: ActivityType.Playing }
  ];
  let statusIndex = 0;
  
  client.user.setActivity(statuses[0].name, { type: statuses[0].type });
  setInterval(() => {
    statusIndex = (statusIndex + 1) % statuses.length;
    client.user.setActivity(statuses[statusIndex].name, { type: statuses[statusIndex].type });
  }, 30000); // Change every 30 seconds
});

// Error handling
client.on('error', error => {
  logger.error('Client error:', error);
});

process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

// Command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user, guild, member, channel } = interaction;

  // Cooldown check
  const cooldownCheck = checkCooldown(user.id, commandName);
  if (cooldownCheck.onCooldown) {
    return await interaction.reply({ 
      content: `⏱️ Please wait ${cooldownCheck.timeLeft} seconds before using this command again.`, 
      ephemeral: true 
    });
  }

  try {
    // PING COMMAND
    if (commandName === 'ping') {
      const timeTaken = Date.now() - interaction.createdTimestamp;
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🏓 Pong!')
        .addFields(
          { name: 'Latency', value: `${Math.abs(timeTaken)}ms`, inline: true },
          { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true },
          { name: 'Uptime', value: `${Math.floor(client.uptime / 60000)} minutes`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // SUM COMMAND
    else if (commandName === 'sum') {
      const input = options.getString('numbers');
      const numbers = input.split(' ').map(x => parseFloat(x));
      
      if (numbers.some(isNaN)) {
        return await interaction.reply({ 
          content: '❌ Invalid input! Please provide valid numbers separated by spaces.', 
          ephemeral: true 
        });
      }
      
      const sum = numbers.reduce((a, b) => a + b, 0);
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔢 Sum Calculator')
        .addFields(
          { name: 'Numbers', value: numbers.join(' + '), inline: false },
          { name: 'Result', value: `**${sum}**`, inline: false }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // HELP COMMAND
    else if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('📚 Bot Commands')
        .setDescription('Here are all available commands:')
        .addFields(
          { name: '🔧 Utility', value: '`/ping` - Check bot latency\n`/sum` - Sum numbers\n`/userinfo` - User information\n`/serverinfo` - Server information', inline: false },
          { name: '🛡️ Moderation', value: '`/kick` - Kick a user\n`/ban` - Ban a user\n`/clear` - Delete messages', inline: false },
          { name: '🎮 Fun', value: '`/joke` - Random joke\n`/roast` - Roast a user\n`/coinflip` - Flip a coin\n`/roll` - Roll dice\n`/poll` - Create a poll', inline: false },
          { name: '🎵 Music', value: '`/join` - Join voice\n`/play` - Play music\n`/pause` - Pause song\n`/resume` - Resume song\n`/skip` - Skip song\n`/nowplaying` - Current song\n`/queue` - Show queue\n`/leave` - Leave voice', inline: false }
        )
        .setFooter({ text: 'Use / to see command details' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // USERINFO COMMAND
    else if (commandName === 'userinfo') {
      const targetUser = options.getUser('user') || user;
      const targetMember = guild.members.cache.get(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`👤 User Information`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Username', value: targetUser.tag, inline: true },
          { name: 'ID', value: targetUser.id, inline: true },
          { name: 'Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Joined Server', value: targetMember ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
          { name: 'Roles', value: targetMember ? targetMember.roles.cache.filter(r => r.id !== guild.id).map(r => r.name).join(', ') || 'None' : 'N/A', inline: false }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // SERVERINFO COMMAND
    else if (commandName === 'serverinfo') {
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle(`🏰 ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: 'Server ID', value: guild.id, inline: true },
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Members', value: `${guild.memberCount}`, inline: true },
          { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
          { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // KICK COMMAND
    else if (commandName === 'kick') {
      if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return await interaction.reply({ content: '❌ You do not have permission to kick members.', ephemeral: true });
      }
      if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return await interaction.reply({ content: '❌ I do not have permission to kick members.', ephemeral: true });
      }

      const targetUser = options.getUser('user');
      const targetMember = guild.members.cache.get(targetUser.id);
      
      if (!targetMember) {
        return await interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
      }
      if (!targetMember.kickable) {
        return await interaction.reply({ content: '❌ I cannot kick this user (higher role or owner).', ephemeral: true });
      }
      if (targetMember.roles.highest.position >= member.roles.highest.position) {
        return await interaction.reply({ content: '❌ You cannot kick someone with equal or higher role.', ephemeral: true });
      }

      const reason = options.getString('reason') || 'No reason provided';
      
      try {
        await targetMember.kick(reason);
        const embed = new EmbedBuilder()
          .setColor('#ff6b6b')
          .setTitle('👢 User Kicked')
          .addFields(
            { name: 'User', value: targetUser.tag, inline: true },
            { name: 'Moderator', value: user.tag, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        logger.info(`${targetUser.tag} kicked by ${user.tag} for: ${reason}`);
      } catch (error) {
        logger.error('Kick error:', error);
        await interaction.reply({ content: '❌ Failed to kick user.', ephemeral: true });
      }
    }

    // BAN COMMAND
    else if (commandName === 'ban') {
      if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: '❌ You do not have permission to ban members.', ephemeral: true });
      }
      if (!guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: '❌ I do not have permission to ban members.', ephemeral: true });
      }

      const targetUser = options.getUser('user');
      const targetMember = guild.members.cache.get(targetUser.id);
      
      if (targetMember) {
        if (!targetMember.bannable) {
          return await interaction.reply({ content: '❌ I cannot ban this user (higher role or owner).', ephemeral: true });
        }
        if (targetMember.roles.highest.position >= member.roles.highest.position) {
          return await interaction.reply({ content: '❌ You cannot ban someone with equal or higher role.', ephemeral: true });
        }
      }

      const reason = options.getString('reason') || 'No reason provided';
      
      try {
        await guild.members.ban(targetUser.id, { reason });
        const embed = new EmbedBuilder()
          .setColor('#c0392b')
          .setTitle('🔨 User Banned')
          .addFields(
            { name: 'User', value: targetUser.tag, inline: true },
            { name: 'Moderator', value: user.tag, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        logger.info(`${targetUser.tag} banned by ${user.tag} for: ${reason}`);
      } catch (error) {
        logger.error('Ban error:', error);
        await interaction.reply({ content: '❌ Failed to ban user.', ephemeral: true });
      }
    }

    // CLEAR COMMAND
    else if (commandName === 'clear') {
      if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return await interaction.reply({ content: '❌ You do not have permission to manage messages.', ephemeral: true });
      }
      if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return await interaction.reply({ content: '❌ I do not have permission to manage messages.', ephemeral: true });
      }

      const amount = options.getInteger('amount');
      
      try {
        await interaction.deferReply({ ephemeral: true });
        const deleted = await channel.bulkDelete(amount, true);
        await interaction.editReply({ content: `✅ Successfully deleted ${deleted.size} messages.` });
        logger.info(`${user.tag} deleted ${deleted.size} messages in ${channel.name}`);
      } catch (error) {
        logger.error('Clear error:', error);
        await interaction.editReply({ content: '❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.' });
      }
    }

    // POLL COMMAND
    else if (commandName === 'poll') {
      const question = options.getString('question');
      const optionsStr = options.getString('options');
      const pollOptions = optionsStr.split('|').map(o => o.trim()).filter(o => o.length > 0);
      
      if (pollOptions.length < 2) {
        return await interaction.reply({ content: '❌ Please provide at least 2 options separated by |', ephemeral: true });
      }
      if (pollOptions.length > 10) {
        return await interaction.reply({ content: '❌ Maximum 10 options allowed.', ephemeral: true });
      }

      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const description = pollOptions.map((opt, i) => `${emojis[i]} ${opt}`).join('\n');
      
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`📊 ${question}`)
        .setDescription(description)
        .setFooter({ text: `Poll by ${user.tag}` })
        .setTimestamp();
      
      const message = await interaction.reply({ embeds: [embed], fetchReply: true });
      for (let i = 0; i < pollOptions.length; i++) {
        await message.react(emojis[i]);
      }
    }

    // ROLL COMMAND
    else if (commandName === 'roll') {
      const sides = options.getInteger('sides') || 6;
      const result = Math.floor(Math.random() * sides) + 1;
      
      const embed = new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('🎲 Dice Roll')
        .setDescription(`You rolled a **${result}** on a ${sides}-sided die!`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // JOKE COMMAND
    else if (commandName === 'joke') {
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle('😂 Random Joke')
        .setDescription(joke)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // ROAST COMMAND
    else if (commandName === 'roast') {
      const targetUser = options.getUser('user') || user;
      const roast = roasts[Math.floor(Math.random() * roasts.length)];
      
      const embed = new EmbedBuilder()
        .setColor('#ff4444')
        .setTitle('🔥 Roasted!')
        .setDescription(`${targetUser}, ${roast}`)
        .setFooter({ text: `Roasted by ${user.tag}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // COINFLIP COMMAND
    else if (commandName === 'coinflip') {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const emoji = result === 'Heads' ? '🪙' : '💰';
      
      const embed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle(`${emoji} Coin Flip`)
        .setDescription(`The coin landed on: **${result}**`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // JOIN COMMAND
    else if (commandName === 'join') {
      if (!member.voice.channel) {
        return await interaction.reply({ content: '❌ You need to be in a voice channel first!', ephemeral: true });
      }

      try {
        const connection = joinVoiceChannel({
          channelId: member.voice.channel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
          queues.delete(guild.id);
        });

        queues.set(guild.id, { connection, player: null, songs: [], isPaused: false });
        
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🎵 Joined Voice Channel')
          .setDescription(`Connected to **${member.voice.channel.name}**`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        logger.info(`Joined voice channel: ${member.voice.channel.name} in ${guild.name}`);
      } catch (error) {
        logger.error('Join voice error:', error);
        await interaction.reply({ content: '❌ Failed to join voice channel.', ephemeral: true });
      }
    }

    // PLAY COMMAND
    else if (commandName === 'play') {
      if (!queues.has(guild.id)) {
        return await interaction.reply({ content: '❌ Use `/join` first to connect me to a voice channel!', ephemeral: true });
      }

      const url = options.getString('url');
      
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        return await interaction.reply({ content: '❌ Please provide a valid YouTube URL.', ephemeral: true });
      }

      await interaction.deferReply();

      try {
        const info = await play.video_info(url);
        const queue = queues.get(guild.id);
        
        if (queue.songs.length >= MAX_QUEUE_SIZE) {
          return await interaction.editReply({ content: `❌ Queue is full! Maximum ${MAX_QUEUE_SIZE} songs allowed.` });
        }

        queue.songs.push({ url, title: info.video_details.title, duration: info.video_details.durationInSec });
        
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('✅ Added to Queue')
          .setDescription(`[${info.video_details.title}](${url})`)
          .addFields(
            { name: 'Duration', value: `${Math.floor(info.video_details.durationInSec / 60)}:${(info.video_details.durationInSec % 60).toString().padStart(2, '0')}`, inline: true },
            { name: 'Position', value: `${queue.songs.length}`, inline: true }
          )
          .setThumbnail(info.video_details.thumbnails[0].url)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });

        if (!queue.player || queue.player.state.status === AudioPlayerStatus.Idle) {
          playSong(guild.id);
        }
      } catch (error) {
        logger.error('Play error:', error);
        await interaction.editReply({ content: '❌ Invalid URL or failed to fetch video information. Make sure the video is available.' });
      }
    }

    // SKIP COMMAND
    else if (commandName === 'skip') {
      const queue = queues.get(guild.id);
      if (!queue || !queue.player) {
        return await interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
      }

      queue.player.stop();
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('⏭️ Skipped')
        .setDescription('Skipped to the next song!')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // PAUSE COMMAND
    else if (commandName === 'pause') {
      const queue = queues.get(guild.id);
      if (!queue || !queue.player) {
        return await interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
      }

      if (queue.isPaused) {
        return await interaction.reply({ content: '❌ Music is already paused!', ephemeral: true });
      }

      queue.player.pause();
      queue.isPaused = true;
      
      const embed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle('⏸️ Paused')
        .setDescription('Music playback paused.')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // RESUME COMMAND
    else if (commandName === 'resume') {
      const queue = queues.get(guild.id);
      if (!queue || !queue.player) {
        return await interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
      }

      if (!queue.isPaused) {
        return await interaction.reply({ content: '❌ Music is not paused!', ephemeral: true });
      }

      queue.player.unpause();
      queue.isPaused = false;
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('▶️ Resumed')
        .setDescription('Music playback resumed.')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // NOW PLAYING COMMAND
    else if (commandName === 'nowplaying') {
      const queue = queues.get(guild.id);
      if (!queue || queue.songs.length === 0) {
        return await interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
      }

      const song = queue.songs[0];
      const embed = new EmbedBuilder()
        .setColor('#1abc9c')
        .setTitle('🎵 Now Playing')
        .setDescription(`[${song.title}](${song.url})`)
        .addFields(
          { name: 'Duration', value: song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : 'Unknown', inline: true },
          { name: 'Status', value: queue.isPaused ? '⏸️ Paused' : '▶️ Playing', inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    // QUEUE COMMAND
    else if (commandName === 'queue') {
      const queue = queues.get(guild.id);
      if (!queue || queue.songs.length === 0) {
        return await interaction.reply({ content: '❌ The queue is empty!', ephemeral: true });
      }

      const queueList = queue.songs.slice(0, 10).map((song, i) => {
        const duration = song.duration ? `[${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}]` : '';
        return `${i === 0 ? '🎵' : `${i}.`} ${song.title} ${duration}`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📜 Music Queue')
        .setDescription(queueList)
        .setFooter({ text: `${queue.songs.length} song(s) in queue` })
        .setTimestamp();
      
      if (queue.songs.length > 10) {
        embed.addFields({ name: 'And more...', value: `${queue.songs.length - 10} more songs` });
      }
      
      await interaction.reply({ embeds: [embed] });
    }

    // LEAVE COMMAND
    else if (commandName === 'leave') {
      const queue = queues.get(guild.id);
      if (!queue) {
        return await interaction.reply({ content: '❌ I am not in a voice channel!', ephemeral: true });
      }

      queue.connection.destroy();
      queues.delete(guild.id);
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('👋 Left Voice Channel')
        .setDescription('Disconnected from voice channel.')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      logger.info(`Left voice channel in ${guild.name}`);
    }

  } catch (error) {
    logger.error(`Error executing ${commandName}:`, error);
    const errorMessage = { content: '❌ An error occurred while executing this command.', ephemeral: true };
    
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else if (!interaction.replied) {
      await interaction.reply(errorMessage);
    }
  }
});

// Login
client.login(BOT_TOKEN).catch(error => {
  logger.error('Failed to login:', error);
  process.exit(1);
});
