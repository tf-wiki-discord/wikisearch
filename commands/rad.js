const { SlashCommandBuilder } = require('discord.js')
const chatbot = require('../eliza')

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('rad')
	          .setDescription('Rogerian psychology with Radbot.')
	          .addStringOption(option => 
			  option.setName('chatbotinput')
			  .setDescription('your question for Radley')
			  .setRequired(true)
			  .setMaxLength(200)),
	      async execute(interaction) {
		      const chatbotinput = interaction.options.getString('chatbotinput')
		      var eliza = new chatbot.ElizaBot();
                      var oktext = true
		      fs.createReadStream("badwords.csv")
			    .pipe(csv())
			    .on("data", (row) => {
				if (findWord(row.badwords, chatbotinput)) {
				   console.log("bad word logged:", row.badwords)
				   oktext = false
				   interaction.reply("I...don't think I should be talking about this...");
				}
			    })
			    .on("end", () => {
				if(oktext) {
				   if(/(\bhi\b|\bhello\b|\bhey\b|\bgreetings\b)/i.test(chatbotinput) ) {
				       interaction.reply(eliza.getInitial());
				   }
				   else if( /(bye|goodbye|see ya)/i.test(chatbotinput) ) {
				       interaction.reply(eliza.getFinal());
				   }
				   else if (chatbotinput) {
				       interaction.reply(eliza.transform(chatbotinput));
				   }		
			       }
			    })
	      },
};
