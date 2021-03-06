const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios')
require('dotenv').config()

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
      const rad_reply = "Hi, I'm Rad, and I want to tell you about " + pageURL;
      //msg.channel.send(rad_reply);

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

            // guess where the first paragraph is because it probably has '''bold text'''.
            // find the first instance.
            // needs to be improved as sometimes it returns nonsense or fragments.
            let re = /'''/;
            let boldStart = editpage.search(re);
            let boldEnd = editpage.indexOf(".", boldStart);
            // text to embed
            console.log(editpage.slice(boldStart, boldEnd+1));

            // oh boy. so the wiki-text may have File:blahblah.jpg or Image:blahblah.jpg.
            // it also may have images in templates, like image=blahblah.png.
            // I prefer the template ones if I find them first. Otherwise find the first File/Image.
            let templateImageRE = /image=.*(jpg|png)/
            const templateMatches = editpage.match(templateImageRE)
            let imageRE = /(Image:|File:).*(png|jpg)/;
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
            const radEmbed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setDescription(editpage.slice(boldStart, boldEnd+1)) 
              .setThumbnail("https://tfwiki.net/wiki/Special:FilePath/PaniniRadWhite.jpg")
              .setTitle(rad_reply)

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
    else if (msg.content.toLowerCase() == "wicked sweet" ) {
       const sweetRide = "https://tfwiki.net/wiki/Special:FilePath/PaniniRadWhite.jpg"
       msg.react(':aboutTheTransformers:') 
       msg.channel.send("Wicked sweet! " + sweetRide)
    }
  }
});

client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
