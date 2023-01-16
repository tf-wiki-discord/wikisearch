const { SlashCommandBuilder } = require('discord.js')

function randomChoice(arr) {
	return arr[Math.floor(arr.length * Math.random())];
}
function isNumeric(value) {
    return /^\d+$/.test(value);
}
const furmanisms = Array("IT NEVER ENDS!","IT IS OVER -- FINISHED!",
	"A SHORT, SHARP LESSON!", "A WHOLE WORLD OF PAIN!",
	"ALL THE DIRTY JOBS...","CAN I DO LESS?",
	"CANNOT, WILL NOT...!","DIE SCREAMING!",
	"DOWN TO EARTH--LITERALLY!","FIGHT AND DIE!",
	"IT CAN BE HURT!",
	"LIKE SOME PREDATORY BIRD!",
	"NEVER DID WANT TO LIVE FOREVER!","NO! YOU'RE DEAD!",
	"POWER BEYOND MEASURE!","REAP THE WHIRLWIND!",
	"SURPLUS TO REQUIREMENTS!","THE WORST CASE OF INDIGESTION IT'S EVER HAD!",
	"TIME I MADE A STAND!","TIME I WASN'T HERE!",
	"WELL AND TRULY!","WHAT ARE YOU PLAYING AT?",
	"WHAT CHANCE DO WE HAVE?","YOU WON'T BELIEVE THE THINGS I CAN DO NOW!"
)
const cmdlen = furmanisms.length

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('furmanism')
	          .setDescription('truly, it never ends.')
		  .addStringOption(option =>
			option
				.setName('index')
				.setDescription(`[optional] pick an index between 0 and ${cmdlen}`)),
	      async execute(interaction) {
		      const index = interaction.options.getString('index') ?? '-1';
		      if (index == '-1') {
	      	      	await interaction.reply(randomChoice(furmanisms))
		      }
		      const numIndex = index*1
		      if(isNumeric(numIndex) && numIndex >= 0 && numIndex < cmdlen) {
			      await interaction.reply(furmanisms[numIndex])
		      } else {
			      await interaction.reply(randomChoice(furmanisms))
		      }
	      },
};
