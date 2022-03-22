const Discord = require('discord.js')
const client = new Discord.Client()
const TFWiki = require('nodemw')
const RateLimiter = require('discord.js-rate-limiter')
const fs = require('fs')
const https = require('https')
const csv = require('csv-parser')
const chatbot = require('./eliza')
const math = require('mathjs')
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

function findWord(word, str) {
  return RegExp('\\b'+ word +'\\b').test(str)
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
    
    if ( /flamewar/i.test(msg.content) ) {
        msg.react("<:flamewar:691696266400235590>");
    }
    if ( /^`*~*\_*\**bah\.?\,?\**\_*~*`*!*$/i.test(msg.content) ) {
        msg.channel.send("Bah!");
    }
    
   if (/(thanks|thank you|big ups|poggers|coggers|based|thankee|themk|toggers),? \brad\b/i.test(msg.content)) {
       msg.react("<:aboutTheTransformers:656259059854344202>");
   }

   if (/!!lurkers/i.test(msg.content) && (msg.channel.name.includes("coding") || msg.channel.name.includes("moderation"))) {
	const list = client.guilds.get("656241088826441729"); 
	list.members.forEach(member => console.log(member.user.username)); 
   }
	  
   if (/!!rad (.*)/i.test(msg.content) && (msg.channel.name.includes("wreck-room") || msg.channel.name.includes("coding") || msg.channel.name.includes("moderation"))) {
 
       var eliza = new chatbot.ElizaBot();
       var chatbotinput = msg.content.match(/!!rad (.*)/)[1]
       
       var oktext = true
       fs.createReadStream("badwords.csv")
            .pipe(csv())
            .on("data", (row) => {
                if (findWord(row.badwords, chatbotinput)) {
                   console.log("bad word logged:", row.badwords)
                   oktext = false
                   msg.reply("I...don't think I should be talking about this...");
                }
            })
            .on("end", () => {
                if(oktext) {
                   if(/(\bhi\b|\bhello\b|\bhey\b|\bgreetings\b)/i.test(chatbotinput) ) {
                       msg.reply(eliza.getInitial());
                   }
                   else if( /(bye|goodbye|see ya)/i.test(chatbotinput) ) {
                       msg.reply(eliza.getFinal());
                   }
                   else if (chatbotinput) {
                       msg.reply(eliza.transform(chatbotinput));
                   }		
               }
            })
   }
   if (/!!gobox/.test(msg.content)) {
        const options = {
            hostname: 'tfwiki.net',
            port: 443,
            path: '/generate_js.php',
            method: 'GET'
        }

        const req = https.request(options, res => {
            //console.log(`GEN JS: statusCode: ${res.statusCode}`)

            res.on('data', d => {
                //process.stdout.write(d)
                var randLinkRegex = /href='(.*?)'/
                var randImageRegex = /img src='(.*?)'/
                const randImage = d.toString().match(randImageRegex)[1]
                const randLink = d.toString().match(randLinkRegex)[1]
                console.log("GOBOX LINK: ", randLink)
                console.log("GOBOX IMG: ", randImage)
                const randEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setURL(randLink)
                    .setImage(randImage)
                    .setTitle("Hi, my name's Rad. Here's a random Gobox!")
                
                msg.channel.send(randEmbed)
            })
        })

        req.on('error', error => {
            console.error(error)
        })

        req.end()    
    }
    if (/!!math (.*?)/.test(msg.content)) {
	
	var expr = msg.content.match(/!!math (.*)/)[1]
	var mathResult = undefined
	try {
		mathResult = math.evaluate(expr)
	}
	catch (err) {
		console.log("MATH ERROR: " + err)
		mathResult = "Oof, sorry. Didn't understand that..."
	}
	finally {
		if(typeof mathResult != undefined) {
			msg.channel.send(expr + " = " + mathResult)
		}
	}
    }
    if (/!!techspec (.*?)/.test(msg.content)) {
        var matchData = msg.content.match(/!!techspec (.*)/)[1]
        var matchYear = undefined
        var charName = undefined
        if(/\//.test(matchData)) {
            var matchStuff = matchData.split(/\//)
            charName = matchStuff[0]
            matchYear = matchStuff[1]
        }
        else {
            charName = matchData
        }
        console.log("TECH SPEC: " + charName + " at year: " + matchYear)
        var searchStr = charName.replace(/\s/g,'')
        var results = []
        fs.createReadStream('techspec.csv')
        .pipe(csv())
        .on('data', (row) => {
            var searchTest = searchStr == row.name
            if(matchYear) {
                searchTest = searchStr == row.name && matchYear == row.year
            }
            if (searchTest) {
                results.push(row)
                console.log(row)
            }
        })
        .on('end', () => {
            console.log("done.")
            if(results.length > 0) {
                // name,faction,year,Strength,Intelligence,Speed,Endurance,Rank,Courage,Firepower,Skill,Teamwork,Cooperation
                var result = results[0]
                var radmsg = `Name: ${charName}\n`
                radmsg += `Faction: ${result.faction} (${result.year})\n`
                radmsg += `Strength: ${result.Strength}          Intelligence: ${result.Intelligence}\n`
                radmsg += `Speed: ${result.Speed}               Endurance: ${result.Endurance}\n`
                radmsg += `Rank: ${result.Rank}                 Courage: ${result.Courage}\n`
                radmsg += `Firepower: ${result.Firepower}        Skill: ${result.Skill}\n`
                if(result.Teamwork && result.Cooperation) {
                    radmsg += `Teamwork: ${result.Teamwork}         Cooperation: ${result.Cooperation}\n`
                }
                msg.channel.send(radmsg)
            }
        });
    }
    
    else if (/\[\[(.*?)\]\]/.test(msg.content)) {

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
      const pageURL = "https://tfwiki.net/wiki/" + pageNameSlug;
      const radEmbed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setURL(pageURL)

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
      if(imageName) {
        // get the direct image file path via Special:FilePath
        radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName}
        if(caption != undefined) {
          radEmbed.footer = {text: caption}
         }
      }

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
        radEmbed.description = description

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
                 radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName}
                 if(caption != undefined && caption != "left" && caption != "right" && caption != "center" && caption != "thumb" && !/upright=/.test(caption) && !/px/.test(caption) ) {
                   radEmbed.footer = {text: caption}
                 }
            }
        }
      }
      else {
        embedTitle = `Hi ${author}, my name's Rad, and I'd like to tell you about ${pageName}, but I can't!`
        console.log(author + " sent " + pageName)
      }
        if(/among us/i.test(pageName)
            || /amongus/i.test(pageName)
            || /amogus/i.test(pageName)
            || /amon gus/i.test(pageName)
            || /a mong us/i.test(pageName)
        ) {
            msg.channel.send(`Hi ${author}, my name's Rad, and I'd like to tell you about the Transformers instead of Among Us!`)
        }
        else {
            radEmbed.title = embedTitle
            msg.channel.send(radEmbed);
        }
      })
    }
    else if (/jiai jo/i.test(msg.content) && Math.random() >= 0.7 ) { // 30% success rate
       //msg.channel.send("JIAI JO!")
       const jiaijoEmbed = new Discord.MessageEmbed()
        .setTitle("JIAI JO!")
        .attachFiles(['./jiaijo.png'])
        .setImage('attachment://jiaijo.png')
       msg.channel.send(jiaijoEmbed)
    }
    else if (/!!qrcode (.*?)/.test(msg.content)) {
        var msgid = msg.content.match(/!!qrcode (.*)/)[1]
        console.log("MSG ID INPUT: " + msgid)
        msg.channel.messages.fetch(msgid)
        .then(m => {
            for(const [key, attach] of m.attachments.entries()) {
                let height = attach.height
                let width = attach.width
                let filename = attach.attachment
                const jsQR = require("jsqr");
                const request = require('request');
                if(/jpg$/.test(filename) || /jpeg$/.test(filename)) {
                    console.log("JPG found")
                    const inkjet = require('inkjet');
                    
                    const qrEmbed = new Discord.MessageEmbed()
                    request({uri: filename, encoding: null }, (err, resp, buffer) => {
                        inkjet.decode(buffer, (err, decoded) => {
                            const code = jsQR(decoded.data, decoded.width, decoded.height)
                            if (code) {
                                console.log("Found QR code", code)
                                console.log("URL: ", code.data)
                                qrEmbed.image = {url: code.data}
                                qrEmbed.title = `Looks like a QR code. It's trying to take you to ${code.data}.`
                                msg.channel.send(qrEmbed)
                            }
                        })
                    })
                }
                else if (/png$/.test(filename)) {
                    console.log("PNG found")
                    const PNG = require("png-js")
                    var f = fs.createWriteStream("./test.png");
                    var req = https.get(filename, function(response) {
                        response.pipe(f);
                    });
                    f.on('finish', function() {
                        PNG.decode("./test.png", function(data) {
                             const code = jsQR(data, width, height)
                             if (code) {
                                 console.log("Found QR code", code)
                                 const qrEmbed = new Discord.MessageEmbed()
                                 qrEmbed.image = {url: code.data}
                                 qrEmbed.title = `Looks like a QR code. It's trying to take you to ${code.data}.`
                                 msg.channel.send(qrEmbed)
                             }
                        })
                    })
                }
            }
        })
        .catch(console.error)
    }
    
    //else if (/!iru/i.test(msg.content)) {
    //    function randomChoice(arr) {
    //        return arr[Math.floor(arr.length * Math.random())];
    //    }
    //    var sayings = Array("noncomb", "Bah!", "[BWU Bisk quote]", "Why it is X, it's not even a Y!", ":O");
    //    msg.channel.send(randomChoice(sayings))
    //}
    else if (/wicked sweet/i.test(msg.content)) {
       msg.channel.send(new Discord.MessageEmbed().setImage('https://tfwiki.net/wiki/Special:FilePath/PaniniRadWhite.jpg'))
    }
  }
});

client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
