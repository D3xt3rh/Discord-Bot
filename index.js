const { Client, GatewayIntentBits, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  new SlashCommandBuilder()
    .setName('sum')
    .setDescription('Sum provided numbers')
    .addStringOption(option =>
      option.setName('numbers')
        .setDescription('Numbers to sum, separated by spaces')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('List available commands'),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user')
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
    .setDescription('Ban a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for ban')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke'),
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join voice channel'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music from YouTube URL')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('YouTube URL')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current song'),
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show music queue'),
  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave voice channel'),
];

const queues = new Map();

async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (queue.songs.length === 0) {
    queue.connection.destroy();
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
    player.on(AudioPlayerStatus.Idle, () => {
      queue.songs.shift();
      playSong(guildId);
    });
  } catch (error) {
    console.error(error);
    queue.songs.shift();
    playSong(guildId);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await client.application.commands.set(commands);
  console.log('Slash commands registered.');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'ping') {
    const timeTaken = Date.now() - interaction.createdTimestamp;
    await interaction.reply(`Pong! Latency: ${timeTaken}ms`);
  } else if (commandName === 'sum') {
    const numbers = options.getString('numbers').split(' ').map(x => parseFloat(x));
    const sum = numbers.reduce((a, b) => a + b, 0);
    await interaction.reply(`The sum is ${sum}!`);
  } else if (commandName === 'help') {
    await interaction.reply(`Available commands:\n/ping - Check latency\n/sum [numbers] - Sum numbers\n/help - This help\n/kick @user [reason] - Kick user\n/ban @user [reason] - Ban user\n/joke - Random joke\n/coinflip - Flip coin\n/join - Join voice channel\n/play [url] - Play music\n/skip - Skip song\n/queue - Show queue\n/leave - Leave voice`);
  } else if (commandName === 'kick') {
    if (!interaction.member.permissions.has(PermissionsBitField.KickMembers)) {
      return await interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.KickMembers)) {
      return await interaction.reply({ content: 'I do not have permission to kick members.', ephemeral: true });
    }
    const user = options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return await interaction.reply({ content: 'User not in server.', ephemeral: true });
    if (!member.kickable) return await interaction.reply({ content: 'Cannot kick this user.', ephemeral: true });
    const reason = options.getString('reason') || 'No reason';
    await member.kick(reason);
    await interaction.reply(`Kicked ${user.tag} for: ${reason}`);
  } else if (commandName === 'ban') {
    if (!interaction.member.permissions.has(PermissionsBitField.BanMembers)) {
      return await interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.BanMembers)) {
      return await interaction.reply({ content: 'I do not have permission to ban members.', ephemeral: true });
    }
    const user = options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);
    if (member && !member.bannable) return await interaction.reply({ content: 'Cannot ban this user.', ephemeral: true });
    const reason = options.getString('reason') || 'No reason';
    await interaction.guild.members.ban(user.id, { reason });
    await interaction.reply(`Banned ${user.tag} for: ${reason}`);
  } else if (commandName === 'joke') {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the scarecrow win an award? Because he was outstanding in his field!",
      "What do you call fake spaghetti? An impasta!",
    ];
    await interaction.reply(jokes[Math.floor(Math.random() * jokes.length)]);
  } else if (commandName === 'coinflip') {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await interaction.reply(`Coin landed on: ${result}`);
  } else if (commandName === 'join') {
    if (!interaction.member.voice.channel) return await interaction.reply('Join a voice channel first.');
    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    queues.set(interaction.guild.id, { connection, player: null, songs: [] });
    await interaction.reply('Joined voice channel.');
  } else if (commandName === 'play') {
    if (!queues.has(interaction.guild.id)) return await interaction.reply('Use /join first.');
    const url = options.getString('url');
    try {
      const info = await play.video_info(url);
      queues.get(interaction.guild.id).songs.push({ url, title: info.video_details.title });
      await interaction.reply(`Added to queue: ${info.video_details.title}`);
      if (!queues.get(interaction.guild.id).player) {
        playSong(interaction.guild.id);
      }
    } catch (error) {
      await interaction.reply('Invalid URL or error fetching video.');
    }
  } else if (commandName === 'skip') {
    if (!queues.has(interaction.guild.id) || !queues.get(interaction.guild.id).player) return await interaction.reply('No music playing.');
    queues.get(interaction.guild.id).player.stop();
    await interaction.reply('Skipped song.');
  } else if (commandName === 'queue') {
    const queue = queues.get(interaction.guild.id);
    if (!queue || queue.songs.length === 0) return await interaction.reply('Queue is empty.');
    const list = queue.songs.map((s, i) => `${i+1}. ${s.title}`).join('\n');
    await interaction.reply(`Queue:\n${list}`);
  } else if (commandName === 'leave') {
    if (!queues.has(interaction.guild.id)) return await interaction.reply('Not in voice channel.');
    queues.get(interaction.guild.id).connection.destroy();
    queues.delete(interaction.guild.id);
    await interaction.reply('Left voice channel.');
  }
});

client.login(config.BOT_TOKEN);