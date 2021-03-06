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
 if (msg.content.startsWith('[[') && msg.content.endsWith(']]')) {
     var l = msg.content.length;
     var article = msg.content.slice(2, l-2);
     article = article.split(" ").join("_");
     const fullWikiArticle = "https://tfwiki.net/wiki/" + article;
     const rad_reply = "Hi, I'm Rad, and I want to tell you about " + fullWikiArticle;
     msg.channel.send(rad_reply);

     const editURL = "https://tfwiki.net/mediawiki/index.php?title=" + article + "&action=edit"
    axios.get(editURL, {
      headers:{
        Accept: 'accept',
        Authorization: 'authorize'
      },
    }).then(response => {
        if(response.status === 200) {
            let editpage = response.data;
            let re = /'''/;
            let boldStart = editpage.search(re);
            let boldEnd = editpage.indexOf(".", boldStart);
            console.log(editpage.slice(boldStart, boldEnd+1));

            let imageRE = /(Image:|File:).*jpg/;
            const matches = editpage.match(imageRE)
            var imageName;
            if(matches) {
                //console.log(matches[0])
                imageName = matches[0].split(" ").join("_");
            }
            if(imageName) {
                const imagePageURL = "https://tfwiki.net/wiki/" +imageName

                axios.get(imagePageURL, {
                    headers:{
                        Accept: 'accept',
                        Authorization: 'authorize'
                    },
                }).then(r => {
                if(r.status===200) {
                    var img = r.data
                    let imRE = /<a href="\/mediawiki\/images.*?">/
                    var imMatch = img.match(imRE);
                        if(imMatch) {
                            const startCut = '<a href="'.length
                            const imLength = imMatch[0].length
                            console.log(imMatch[0].slice(startCut, imLength-2))
                        const radEmbed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .setImage("https://tfwiki.net" + imMatch[0].slice(startCut, imLength-2))
                            .setDescription(editpage.slice(boldStart, boldEnd+1))
                            msg.channel.send(radEmbed);
                        }
                    }
                })
            }
            else {
                const radEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setDescription(editpage.slice(boldStart, boldEnd+1))
                msg.channel.send(radEmbed);
            }
        }
      return response;
    }).catch(err => {
      console.log(err);
    });
 }
});

client.login(process.env.TFWIKISEARCH_BOT_TOKEN)
