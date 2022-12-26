const { SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('ping')
	          .setDesciption('Replies with pong!'),
	      async execute(interaction) {
		      await interaction.reply('Pong!')
	      },
};
