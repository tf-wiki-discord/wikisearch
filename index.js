const Discord = require('discord.js');
const client = new Discord.Client();
var tfwiki = require('nodemw');
require('dotenv').config()

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 client.user.setUsername('GO!-Bot')
 client.user.setActivity('with Carlos and Alexis')
 });

client.on('message', msg => {
 if (msg.content.startsWith('[[') && msg.content.endsWith(']]')) {
     var l = msg.content.length;
     var article = msg.content.slice(2, l-2);
     article = article.split(" ").join("_");
     const rad_reply = "Hi, I'm Rad, and I want to tell you about https://tfwiki.net/wiki/" + article;
     msg.channel.send(rad_reply);

     var bot = tfwiki({
         protocol: 'http',
         server: 'tfwiki.net',
         path: '/mediawiki/api.php',
         "username": process.env.WIKIUSERNAME,
         "password": process.env.WIKIUSERPASSWORD
     });
     var params = {
         title: article,
         action: 'edit'
     };
     bot.api.call(params, function(err, info, next, data) {
        console.log(data);
     });
 }
});

client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
