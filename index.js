const fs = require('fs');
const Discord = require('discord.js');
const { token } = require('./token.json');
const { prefix } = require('./config.json');
const request = require('request');

const client = new Discord.Client();

let id;
let channel;
let channelId = 0;
let progress = false;

// Setup state
if (!fs.existsSync('id.json')) {
  const json = `{"id": ${id}}\n`;
  fs.writeFile('id.json', json, 'utf8', (error) => {
    if (error) { console.log('Write file error: ', error); }
  });
} else {
  fs.readFile('id.json', 'utf8', (error, data) => {
    if (error) {
      console.log('Read file error: ', error);
    } else {
      ({ id } = JSON.parse(data));
    }
  });
}

const post = function postContent(recentId) {
  let count = recentId - id;

  if (count > 5) { count = 5; }

  request(`https://archillect-api.now.sh/visuals?per=${count}`, (error, response, body) => {
    if (error) {
      channel.send('postContent Error: ', error);
      return;
    }

    const res = JSON.parse(body);
    res.reverse().forEach((el) => {
      channel.send(el.original);
    });

    id = recentId;
    const json = `{"id": ${id}}\n`;
    fs.writeFile('id.json', json, 'utf8', (err) => {
      if (err) { console.log('File write error: ', err); }
    });
  });
};

const check = function archiCheck() {
  request('https://archillect-api.now.sh/visuals?per=1', (error, response, body) => {
    if (error) {
      channel.send('archiCheck Error: ', error);
      return;
    }

    let [resId] = JSON.parse(body);
    resId = resId.id;

    if (resId !== id) { post(resId); } else { channel.send('No new Archillect content.'); }
  });
};

const start = function startBot() {
  // Every 10 minutes, check for new archillect content
  progress = true;
  check();
  setInterval(check, 600000);
};

client.on('ready', () => {
  console.log('Discollect is ready.');
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) { return; }

  try {
    channelId = message.guild.channels.find('name', 'archillect').id;
    channel = client.channels.get(channelId);

    // Don't re-initiate the loop, just force a check
    if (progress) { check(); } else { start(); }
  } catch (error) {
    message.reply('Please add a text channel titled Archillect for me to use.');
  }
});

client.login(token);
