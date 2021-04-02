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
            /^'''/.test(line)
            || /^\"/.test(line)
            || /^\*/.test(line)
            || /^:/.test(line)
            || /^\[\[[^(File:|Image:|file:)]/.test(line)
            || /^\w/.test(line)) {
            return line
        }
    }
    return ''
}

function findHashedText(articleList, articleName) {
    if(/#/.test(articleName)) {
        var baseAndHash = articleName.split('#')
        var hashtext = baseAndHash[1].replace(/_/g, " ")
        if(hashtext) {
            console.log("HASH TEXT: " + hashtext)
            let hashRE = new RegExp(`(=+)(\\s*?)('*?)${hashtext}(\\s*?)('*?)(=+)`)
            var blurbIdx = articleList.findIndex(x => hashRE.test(x))
            if(blurbIdx != -1) {
                const blurbList = articleList.slice(blurbIdx)
                const blurb = bestFirst(blurbList)
                console.log("HASH BLURB: "+blurb)
                return blurb
            }
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

    var bot = new TFWiki({
      protocol: 'https',           // HTTPS is good
      server: 'tfwiki.net',  // host name of MediaWiki-powered site
      path: 'mediawiki',                  // path to api.php script
      debug: false                 // is more verbose when set to true
    });
    if (/\[\[(.*?)\]\]/.test(msg.content)) {

        // prevent / reduce spamming
        let limited = rateLimiter.take(msg.author.id)
        if(limited) {
           msg.channel.send("Whoa, whoa, calm down!") 
           return;
        }
      //strip off the [[ ]]s
      var pageName = msg.content.match(/\[\[(.*?)\]\]/)[1];
      var pageNameSlug = pageName.split(" ").join("_");

      // #toys in Discord expands to a channel ID, which confuses the bot if searching for #Toys in the wiki article
      // this will sanitize the input
      const toysChannelRE = /(<#674063451877933091>)/
      const toyMatch = pageNameSlug.match(toysChannelRE)
      if(toyMatch) {
        pageNameSlug = pageNameSlug.replace(toysChannelRE, "#Toys")
        console.log("Page name sanitized (#toys)")
      }
      
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
      console.log("PAGE NAME SLUG: " + pageNameSlug)
      bot.getArticle(pageNameSlug, true, function(err, data) { 
      if (err) {
        console.error("ERROR: " +err);
        return;
      }
        
      var embedTitle = "Hi, my name's Rad, and I wanna tell you about " + pageName + "!"
        
      if(data) {
        const articleAsList = data.split(/\n/)
        var description = findHashedText(articleAsList, pageNameSlug) || bestFirst(articleAsList)
        description = description.replace(/'''/g, "");
        description = description.replace( /(<ref>.*?<\/ref>)/g, ""); // remove ref tags, assuming they aren't nested
        description = description.replace(/\[\[([^\]\]]*?)\|(.*?)\]\]/g, "$2") // change [[abc|123]] to 123
        description = description.replace(/\{\{w\|([^\}\}]*?)\|(.*?)\}\}/g, "$2") // remove wikipedia links
        description = description.replace(/\{\{storylink\|([^\}\}]*?)\|(.*?)\}\}/g, "(From: $2)")  // prettify storylinks
        description = description.replace(/\{\{([^\}\}]*?)\|(.*?)\}\}/g, "$2") // change {{abc|123}} to 123
        description = description.replace(/\[\[/g, ""); // remove opening tags
        description = description.replace(/\]\]/g, ""); // remove closing tags
        description = description.replace(/^:/g, ""); 
        description = description.replace(/''/g, "")
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
