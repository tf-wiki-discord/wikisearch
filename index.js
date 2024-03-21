const {Client, Collection, Events, GatewayIntentBits, EmbedBuilder}  = require('discord.js')
const client = new Client({
    intents: [GatewayIntentBits.Guilds,
	      GatewayIntentBits.GuildMessages,
	      GatewayIntentBits.GuildMembers,
	      GatewayIntentBits.MessageContent]
});
const TFWiki = require('nodemw')
const RateLimiter = require('discord.js-rate-limiter')
const fs = require('fs')
const path = require('node:path')
require('dotenv').config()

const numCommands = 1
const interval = 1
const intervalSec = interval * 1000
let rateLimiter = new RateLimiter.RateLimiter(numCommands, intervalSec)

const templateImageRE = /image=.*(jpg|jpeg|png)/i
const templateCaptionRE = /caption=(.*)/i
const imageRE = /(Image:|File:).*?(png|jpg|jpeg|gif)/i
const bracketRE = /\{\{/
const captionRE = /File:.*]]|Image:.*]]/i

function getUserFromMention(mention) {
	// The id is the first and only match found by the RegEx.
	const matches = mention.match(/^<@!?(\d+)>$/);

	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) return;

	// However, the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	const id = matches[1];

	return client.users.cache.get(id);
}

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

client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user.tag}!`);
  client.user.setUsername('Rad, the GO!-Bot')
  client.user.setActivity('with Carlos and Alexis')
});

client.on('messageCreate', msg => {
 
  const notserious = !msg.channel.name.includes("editing") && !msg.channel.name.includes("archival") && !msg.channel.name.includes("image-editing")
	
  // [[ ]] activates the bot
  if (!msg.author.bot) {
	  
    var bot = new TFWiki({
      //protocol: 'https',           // HTTPS is good
      protocol: 'http',           // HTTPS is good
      server: 'tfwiki.net',  // host name of MediaWiki-powered site
      path: 'mediawiki',                  // path to api.php script
      debug: false                 // is more verbose when set to true
    });
    
  if(notserious) {
    if ( /flamewar/i.test(msg.content) ) {
        msg.react("<:flamewar:691696266400235590>");
    }
    if ( /yvonco/i.test(msg.content) ) {
        msg.react("<:yvonco:715978467728031814>");
    }
    if ( /^`*~*\_*\**bah\.?\,?\**\_*~*`*!*$/i.test(msg.content) ) {
        msg.channel.send("Bah!");
    }
   
   if (/(thanks|thank you|big ups|poggers|coggers|based|thankee|themk|toggers),? \brad\b/i.test(msg.content)) {
       msg.react("<:aboutTheTransformers:656259059854344202>");
   }
  }
     
  if (/\[\[(.*?)\]\]/.test(msg.content)) {

        var author = msg.author.username

        // prevent / reduce spamming
        let limited = rateLimiter.take(msg.author.id)
        if(limited) {
           msg.channel.send("Whoa, whoa, calm down!") 
           return;
        }
        
      //strip off the [[ ]]s
      var pageName = msg.content.match(/\[\[(.*?)\]\]/)[1];
      var pageNameSlug = pageName.split(" ").join("_");

      // various channel in Discord expand to a channel ID, which confuses the bot if searching for #Toys in the wiki article
      // this will sanitize the input
      const toysChannelRE = /(<#674063451877933091>)/
      const toyMatch = pageNameSlug.match(toysChannelRE)
      if(toyMatch) {
        pageNameSlug = pageNameSlug.replace(toysChannelRE, "#Toys")
        console.log("Page name sanitized (#toys)")
      }
      const writingChannelRE = /(<#674702407774502922>)/
      const writeMatch = pageNameSlug.match(writingChannelRE)
      if(writeMatch) {
        pageNameSlug = pageNameSlug.replace(writingChannelRE, "#Other")
        console.log("Page name sanitized (#other)")
      }

      // handle https://tfwiki.net/wiki/Special:Random separately
      var pageURL = "https://tfwiki.net/wiki/" + pageNameSlug;
	    pageURL = pageURL.replace(/\?/g, "%3F");
      //const radEmbed = new EmbedBuilder().setColor('#0099ff').setURL(pageURL)

      var imageName;
      var caption;
      const templateMatches = pageURL.match(templateImageRE)
      const matches = pageURL.match(imageRE)
      if(templateMatches) {
        console.log("(msg from " + author + "): TEMPLATE FOUND (URL): " + templateMatches[0].split(" ").join("_").slice(6))
        imageName = "FILE:" + templateMatches[0].split(" ").join("_").slice(6)
      }
      else if(matches) {
        console.log("(msg from "+ author + "): WIKI FILE or IMAGE FOUND (URL): "+matches[0])
        imageName = matches[0].split(" ").join("_");
      }
      //if(imageName) { // get the direct image file path via Special:FilePath //radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName} if(caption != undefined) { radEmbed.footer = {text: caption} } }

      bot.getArticle(pageNameSlug, true, function(err, data) { 
      if (err) {
        console.error("ERROR: " +err);
        return;
      }
        
      var embedTitle = "Hi, my name's Rad, and I wanna tell you about " + pageName + "!"
      if(toyMatch || writeMatch) {
        embedTitle = "Hi, my name's Rad, and I wanna tell you about " + pageNameSlug + "!"
      }
        
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
        //radEmbed.description = description

        if(!imageName) {
            const templateMatches = data.match(templateImageRE)
            const matches = data.match(imageRE)
            var caption = ''
            if(templateMatches) {
                var captionline = data.match(templateCaptionRE)
                if(captionline && captionline.length > 0) {
                  caption = captionline[0]
                  caption = caption.split("=")[1]
                }
                console.log("(msg from " + author + "): TEMPLATE FOUND (URL) IN ARTICLE: " + templateMatches[0].split(" ").join("_").slice(6))
                imageName = "FILE:" + templateMatches[0].split(" ").join("_").slice(6)
            }
            else if(matches) {
                var captionline = data.match(captionRE)
                if(captionline && captionline.length > 0) {
                caption = captionline[0]
                caption = caption.replace(/'''/g, "");
                caption = caption.replace( /(<ref>.*?<\/ref>)/g, ""); // remove ref tags, assuming they aren't nested
                caption = caption.replace(/\[\[([^\]\]]*?)\|(.*?)\]\]/g, "$2") // change [[abc|123]] to 123
                caption = caption.replace(/\{\{w\|([^\}\}]*?)\|(.*?)\}\}/g, "$2") // remove wikipedia links
                caption = caption.replace(/\{\{storylink\|([^\}\}]*?)\|(.*?)\}\}/g, "(From: $2)")  // prettify storylinks
                caption = caption.replace(/\{\{([^\}\}]*?)\|(.*?)\}\}/g, "$2") // change {{abc|123}} to 123
                caption = caption.replace(/\[\[/g, ""); // remove opening tags
                caption = caption.replace(/\]\]/g, ""); // remove closing tags
                caption = caption.replace(/''/g, "");
                caption = caption.replace(/<br><hr>/g, ": ");
                caption = caption.replace(/<br>/g, " ");
                caption = caption.split("|").pop()
                console.log("Caption? " +  caption)
                }

              console.log("(msg from "+ author + "): WIKI FILE or IMAGE FOUND (URL) IN ARTICLE: "+matches[0])
                imageName = matches[0].split(" ").join("_");
            }
            if(imageName) {
                 // get the direct image file path via Special:FilePath
                 //radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName}
                 if(caption != undefined && caption != "left" && caption != "right" && caption != "center" && caption != "thumb" && !/upright=/.test(caption) && !/px/.test(caption) ) {
                   //radEmbed.footer = {text: caption}
                 }
            }
        }
      }
        console.log(author + " sent " + pageName)

        if(/among us/i.test(pageName)
            || /amongus/i.test(pageName)
            || /amogus/i.test(pageName)
            || /amon gus/i.test(pageName)
            || /a mong us/i.test(pageName)
        ) {
            msg.channel.send(`Hi ${author}, my name's Rad, and I'd like to tell you about the Transformers instead of Among Us!`)
        }
        else {
	 if(pageName === "Special:RecentChanges") {
		embedTitle = `Hi ${author}, my name's Rad, and here's a link to recent changes on the wiki!`
      	 }
      	 else if(pageName === "Special:Random") {
		embedTitle = `Hi ${author}, my name's Rad, and here's a page on the wiki!`
      	 }
	 else if(data) {
        	embedTitle = "Hi, my name's Rad, and I wanna tell you about " + pageName + "!"
		//embedTitle = embedTitle.replace(/\?/g, "%3F");  // escape rare articles with ?s in them
	 }
	 else {
		embedTitle = `Hi ${author}, my name's Rad, and I'd like to tell you about ${pageName}, but I can't!`
	 }
            //radEmbed.title = embedTitle

	//if this is stable, this is the new radEmbed
	var radEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(embedTitle)
	.setTimestamp()
	if(pageURL) {
	  radEmbed.setURL(pageURL)
	}
	if(description) {
	  radEmbed.setDescription(description)
	}

        if(imageName) {     
	  radEmbed.setImage("https://tfwiki.net/wiki/Special:FilePath/" + imageName)
	}
        if(caption) {
	  radEmbed.setFooter({text: caption});
	}

        msg.channel.send({embeds: [radEmbed]})
        }
      })
    }

    else if (/jiai jo/i.test(msg.content) && Math.random() >= 0.7 ) { // 30% success rate
       const jiaijoEmbed = new EmbedBuilder()
        .setColor(0x0099FF).setTitle("JIAI JO!!")
       msg.channel.send({embeds: [jiaijoEmbed], files: ['./jiaijo.png']})
    }
    
    else if (/wicked sweet/i.test(msg.content)) {
	const wickedEmbed = new EmbedBuilder()
        .setColor(0x0099FF).setFooter({text: "Hi! I'm Rad! You're wicked sweet!"})
       msg.channel.send({embeds: [wickedEmbed], files: ['./wickedsweet.png']})
    }

  }
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" properties.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if(!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	if(!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
