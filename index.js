/*const Discord = require("discord.js");
const config = require("./config.json");

const client = new Discord.Client();

client.login(config.BOT_TOKEN);

//const client = new Discord.Client();


client.on("message", function(message) { 
                                         
});                                      

client.login(config.BOT_TOKEN);

client.on("message", function(message) {
  if (message.author.bot) return;
});

const prefix = "!";

client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
});
client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();
});
const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "ping") {
            
  } 

if (command === "ping") {
  const timeTaken = Date.now() - message.createdTimestamp;
  message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
}
if (command === "ping") {
  const timeTaken = Date.now() - message.createdTimestamp;
  message.reply(`Ping! This message had a latency of ${timeTaken}ms.`);
}

else if (command === "sum") {
                             
}                            
else if (command === "sum") {
  const numArgs = args.map(x => parseFloat(x));
  const sum = numArgs.reduce((counter, x) => counter += x);
  message.reply(`The sum of all the arguments you provided is ${sum}!`);
}*/
const Discord = require("discord.js");
const config = require("./config.json");

const client = new Discord.Client()
const prefix = "!";

client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }

  else if (command === "sum") {
    const numArgs = args.map(x => parseFloat(x));
    const sum = numArgs.reduce((counter, x) => counter += x);
    message.reply(`The sum of all the arguments you provided is ${sum}!`);
  }
});

client.login(config.BOT_TOKEN);