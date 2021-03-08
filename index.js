const Discord = require('discord.js')
const client = new Discord.Client()
const axios = require('axios')
const TFWiki = require('nodemw')
const RateLimiter = require('discord.js-rate-limiter')
require('dotenv').config()

const numCommands = 1
const interval = 1
const intervalSec = interval * 1000
let rateLimiter = new RateLimiter.RateLimiter(numCommands, intervalSec)

const templateImageRE = /image=.*(jpg|png)/i
const imageRE = /(Image:|File:).*?(png|jpg|gif)/i
const bracketRE = /\{\{/

function bestFirst(list) {
    //given a list of newline-separated lines,
    //pick the first one that starts with a letter, a quote, or a bold
    //this will likely be the first line of the article, and not some
    //wiki markup, which starts with tags like : or [[, etc.
    for (const line of list) {
        if(
            line.startsWith("'''")
            || line.startsWith("\"")
            || /^\[\[[^(File:|Image:)]/.test(line)
            || /^\w/.test(line)) {
            return line
        }
    }
    return ''
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setUsername('Rad, the GO!-Bot')
  client.user.setActivity('with Carlos and Alexis')
});

client.on('message', msg => {
  // [[ ]] activates the bot
  if (!msg.author.bot) {

    // prevent / reduce spamming
    let limited = rateLimiter.take(msg.author.id)
    if(limited) {
       msg.channel.send("Whoa, whoa, calm down!") 
       return;
    }

    var bot = new TFWiki({
      protocol: 'https',           // HTTPS is good
      server: 'tfwiki.net',  // host name of MediaWiki-powered site
      path: 'mediawiki',                  // path to api.php script
      debug: false                 // is more verbose when set to true
    });
    if (/\[\[(.*?)\]\]/.test(msg.content)) {
    
      //strip off the [[ ]]s
      var pageName = msg.content.match(/\[\[(.*?)\]\]/)[1];
      var pageNameSlug = pageName.split(" ").join("_");

      const pageURL = "https://tfwiki.net/wiki/" + pageNameSlug;
      const radEmbed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setURL(pageURL)

      var imageName;
      const templateMatches = pageURL.match(templateImageRE)
      const matches = pageURL.match(imageRE)
      if(templateMatches) {
        console.log("TEMPLATE FOUND (URL): " + templateMatches[0].split(" ").join("_").slice(6))
        imageName = "FILE:" + templateMatches[0].split(" ").join("_").slice(6)
            }
            else if(matches) {
              console.log("WIKI FILE or IMAGE FOUND (URL): "+matches[0])
              imageName = matches[0].split(" ").join("_");
            }
            if(imageName) {
                // get the direct image file path via Special:FilePath
                radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName}
            }
      bot.getArticle(pageNameSlug, true, function(err, data) { 
        if (err) {
            console.error("ERROR: " +err);
            return;
          }
        var embedTitle = "Hi, my name's Rad, and I wanna tell you about " + pageName + "!"
        
        if(data) {
           var description = bestFirst(data.split(/\n/)) 
           description = description.replace(/'''/g, "");
           description = description.replace(/\[\[/g, "");
           description = description.replace(/\]\]/g, "");
           console.log(description)
           radEmbed.description = description

           if(!imageName) {
               const templateMatches = data.match(templateImageRE)
               const matches = data.match(imageRE)
               if(templateMatches) {
                    console.log("TEMPLATE FOUND (ARTICLE): " + templateMatches[0].split(" ").join("_").slice(6))
                    imageName = "FILE:" + templateMatches[0].split(" ").join("_").slice(6)
                }
                else if(matches) {
                  console.log("WIKI FILE or IMAGE FOUND (ARTICLE): "+matches[0])
                  imageName = matches[0].split(" ").join("_");
                }
                if(imageName) {
                    // get the direct image file path via Special:FilePath
                    radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName}
                }
            }
        }
        else {
            embedTitle = "Hi, my name's Rad, and I'd like to tell you about " + pageName + ", but I can't!"
        }
        radEmbed.title = embedTitle
        msg.channel.send(radEmbed);
      })
    }
    else if (/wicked sweet/i.test(msg.content)) {
       msg.channel.send(new Discord.MessageEmbed().setImage('https://tfwiki.net/wiki/Special:FilePath/PaniniRadWhite.jpg'))
    }
  }
});

client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
