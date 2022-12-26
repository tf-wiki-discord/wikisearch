const { SlashCommandBuilder } = require('discord.js')
const math = require('mathjs')

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('math')
	          .setDescription('evaluate math with Radbot!')
	          .addStringOption(option => 
			  option.setName('expr')
			  .setDescription('math input')
			  .setRequired(true)
			  .setMaxLength(200)),
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
	      },
};
