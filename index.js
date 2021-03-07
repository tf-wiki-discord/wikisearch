const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios')
require('dotenv').config()

const templateImageRE = /image=.*(jpg|png)/i
const imageRE = /(Image:|File:).*?(png|jpg|gif)/i
const bracketRE = /\{\{/

function regexIndexOf(string, regex, startpos) {
    var i = string.substring(startpos || 0).search(regex);
    return (i >= 0) ? (i + (startpos || 0)) : i;
}

function goodFirst(s) {
    console.log(s)
    for (const block of s.split("\n")) {
        if(
            block
            && !imageRE.test(block)
            && !templateImageRE.test(block)
            && !bracketRE.test(block)) {
            return block
        }
    }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setUsername('GO!-Bot')
  client.user.setActivity('with Carlos and Alexis')
});

client.on('message', msg => {
  // [[ ]] activates the bot
  if (!msg.author.bot) {
    if (/\[\[(.*?)\]\]/.test(msg.content)) {
    
      //strip off the [[ ]]s
      var pageName = msg.content.match(/\[\[(.*?)\]\]/)[1];
      var pageNameSlug = pageName.split(" ").join("_");

      const pageURL = "https://tfwiki.net/wiki/" + pageNameSlug;

      // here's a trick: Pull the wiki-text by pulling an "edit" page.
      // this prevents unnecessary downloading of the whole main page.
      // really should replaced with a call to MediaWiki's API.
      const editURL = "https://tfwiki.net/mediawiki/index.php?title=" + pageNameSlug + "&action=edit"
      axios.get(editURL, {
          headers:{
            Accept: 'accept',
            Authorization: 'authorize'
          },
        }).then(response => {
          if(response.status === 200) {
            let editpage = response.data;
              //console.log("FULL CONTENT: " + editpage) // don't leave this on unless debugging!

            var noCreate = /You do not have permission to create pages/.test(editpage)
            // guess where the first paragraph is because it probably has '''bold text'''.
            // find the first instance.
            // needs to be improved as sometimes it returns nonsense or fragments.
            let re = /'''/;
            let boldStart = editpage.search(re);
            let boldEnd = regexIndexOf(editpage, /(\.'''|!'''|\?'''|\.|\?|!)\s*?\n/, boldStart);
            // text to embed
            //var description = editpage.slice(boldStart, boldEnd+1)

            var description = goodFirst(editpage)
            description = description.replace(/'''/g, "");
            description = description.replace(/\[\[/g, "");
            description = description.replace(/\]\]/g, "");
            console.log(description)

            // oh boy. so the wiki-text may have File:blahblah.jpg or Image:blahblah.jpg.
            // it also may have images in templates, like image=blahblah.png.
            // I prefer the template ones if I find them first. Otherwise find the first File/Image.
            const templateMatches = editpage.match(templateImageRE)
            const matches = editpage.match(imageRE)
            var imageName;
            if(templateMatches) {
              console.log("TEMPLATE FOUND: " + templateMatches[0].split(" ").join("_").slice(6))
              imageName = "FILE:" + templateMatches[0].split(" ").join("_").slice(6)
            }
            else if(matches) {
              console.log("WIKI FILE or IMAGE FOUND: "+matches[0])
              imageName = matches[0].split(" ").join("_");
            }
            var embedTitle = "Hi, my name's Rad, and I wanna tell you about " + pageName + "!"
            if(noCreate) {
                embedTitle = "Hi, my name's Rad, and I'd like to tell you about " + pageName + ", but I can't!"
            }
            const radEmbed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setDescription(description)
              .setTitle(embedTitle)
              .setURL(pageURL)

            if(imageName) {
                // get the direct image file path via Special:FilePath
                radEmbed.image = {url: "https://tfwiki.net/wiki/Special:FilePath/" + imageName}
            }
            msg.channel.send(radEmbed);
        }
      return response;
      }).catch(err => {
      console.log(err);
      });
    }
    else if (/wicked sweet/i.test(msg.content)) {
       msg.channel.send(new Discord.MessageEmbed().setImage('https://tfwiki.net/wiki/Special:FilePath/PaniniRadWhite.jpg'))
    }
  }
});

client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
