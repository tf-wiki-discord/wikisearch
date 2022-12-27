const { SlashCommandBuilder } = require('discord.js')
const chatbot = require('../eliza')
const csv = require('csv-parser')
const fs = require('fs')

function findWord(word, str) {
  return RegExp('\\b'+ word +'\\b').test(str)
}

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('rad')
	          .setDescription('Rogerian psychology with Radbot.')
	          .addStringOption(option => 
			  option.setName('input')
			  .setDescription('your question for Radley')
			  .setRequired(true)
			  .setMaxLength(200)),
	      async execute(interaction) {
		      const input = interaction.options.getString('input')
		      var eliza = new chatbot.ElizaBot();
                      var oktext = true
		      fs.createReadStream("badwords.csv")
			    .pipe(csv())
			    .on("data", (row) => {
				if (findWord(row.badwords, input)) {
				   console.log("bad word logged:", row.badwords)
				   oktext = false
				   interaction.reply("I...don't think I should be talking about this...");
				}
			    })
			    .on("end", () => {
				if(oktext) {
				   var reply = "You said: " + input + "\n"
				   if(/(\bhi\b|\bhello\b|\bhey\b|\bgreetings\b)/i.test(input) ) {
				       interaction.reply(reply + eliza.getInitial());
				   }
				   else if( /(bye|goodbye|see ya)/i.test(input) ) {
				       interaction.reply(reply + eliza.getFinal());
				   }
				   else if (input) {
				       interaction.reply(reply + eliza.transform(input));
				   }		
			       }
			    })
	      },
};
