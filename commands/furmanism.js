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
				.setDescription(`[optional] pick an index between 0 and ${cmdlen-1}`)),
	async execute(interaction) {
		const index = interaction.options.getString('index');
		
		// If no index provided, return random furmanism
		if (!index) {
			await interaction.reply(randomChoice(furmanisms));
			return;
		}
		
		const numIndex = parseInt(index);
		
		// If valid numeric index, return that furmanism
		if (isNumeric(index) && numIndex >= 0 && numIndex < cmdlen) {
			await interaction.reply(furmanisms[numIndex]);
		} else {
			// If invalid index, return random furmanism
			await interaction.reply(randomChoice(furmanisms));
		}
	},
};
