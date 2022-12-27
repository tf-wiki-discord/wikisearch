const { SlashCommandBuilder } = require('discord.js')
const https = require('https')
const options = {
            hostname: 'tfwiki.net',
            port: 443,
            path: '/generate_js.php',
            method: 'GET'
        }

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('gobox')
	          .setDescription('A random gobox from TFWiki')
	      async execute(interaction) {
		      var mathResult = undefined
		      try {
			      mathResult = math.evaluate(expr)
		      } catch (err) {
			      console.error("MATH ERROR: " + err)
			      await interaction.reply({ content: "Oof, sorry. Didn't understand that...", ephemeral: true })
		      }
		      if(typeof mathResult != undefined) {
			      let result = expr + " = " + mathResult
		      	      await interaction.reply(result)
		      }


        const req = https.request(options, res => {
            res.on('data', d => {
                var randLinkRegex = /href='(.*?)'/
                var randImageRegex = /img src='(.*?)'/
                const randImage = d.toString().match(randImageRegex)[1]
                const randLink = d.toString().match(randLinkRegex)[1]
                console.log("GOBOX LINK: ", randLink)
                console.log("GOBOX IMG: ", randImage)
                const randEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setURL(randLink)
                    .setImage(randImage)
                    .setTitle("Hi, my name's Rad! Here's a random Gobox!")
                
                interaction.reply({embeds: [randEmbed]})
                //msg.channel.send({embeds: [randEmbed]})
            })
        })

        req.on('error', error => {
            console.error(error)
        })

        req.end()    
      },
};
