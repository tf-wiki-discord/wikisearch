const { SlashCommandBuilder } = require('discord.js')

function randomChoice(arr) {
	return arr[Math.floor(arr.length * Math.random())];
}
const furmanisms = Array(
	"A SHORT, SHARP LESSON!", "A WHOLE WORLD OF PAIN!",
	"ALL THE DIRTY JOBS...","CAN I DO LESS?",
	"CANNOT, WILL NOT...!","DIE SCREAMING!",
	"DOWN TO EARTH--LITERALLY!","FIGHT AND DIE!",
	"IT CAN BE HURT!","IT IS OVER -- FINISHED!",
	"IT NEVER ENDS!","LIKE SOME PREDATORY BIRD!",
	"NEVER DID WANT TO LIVE FOREVER!","NO! YOU'RE DEAD!",
	"POWER BEYOND MEASURE!","REAP THE WHIRLWIND!",
	"SURPLUS TO REQUIREMENTS!","THE WORST CASE OF INDIGESTION IT'S EVER HAD!",
	"TIME I MADE A STAND!","TIME I WASN'T HERE!",
	"WELL AND TRULY!","WHAT ARE YOU PLAYING AT?",
	"WHAT CHANCE DO WE HAVE?","YOU WON'T BELIEVE THE THINGS I CAN DO NOW!"
)

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('furmanism')
	          .setDescription('truly, it never ends.'),
	      async execute(interaction) {
	      	      await interaction.reply(randomChoice(furmanisms))
	      },
};
