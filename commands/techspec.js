const { SlashCommandBuilder } = require('discord.js')
const csv = require('csv-parser')
const fs = require('fs')

module.exports = {
	data: new SlashCommandBuilder()
	          .setName('techspec')
	          .setDescription('Techspecs!')
	          .addStringOption(option => 
			  option.setName('techinput')
			  .setDescription('techspec input')
			  .setRequired(true)
			  .setMaxLength(40)),
	      async execute(interaction) {
		        const techinput = interaction.options.getString('techinput')
			var matchYear = undefined
			var charName = undefined
			if(/\//.test(techinput)) {
			    var matchStuff = techinput.split(/\//)
			    charName = matchStuff[0]
			    matchYear = matchStuff[1]
			}
			else {
			    charName = techinput
			}
			console.log("TECH SPEC: " + charName + " at year: " + matchYear)
			var searchStr = charName.replace(/\s/g,'')
			var results = []
			fs.createReadStream('techspec.csv')
			.pipe(csv())
			.on('data', (row) => {
			    var searchTest = searchStr == row.name
			    if(matchYear) {
				searchTest = searchStr == row.name && matchYear == row.year
			    }
			    if (searchTest) {
				results.push(row)
				console.log(row)
			    }
			})
			.on('end', () => {
			    console.log("done.")
			    if(results.length > 0) {
				// name,faction,year,Strength,Intelligence,Speed,Endurance,Rank,Courage,Firepower,Skill,Teamwork,Cooperation
				var result = results[0]
				var radmsg = `Name: ${charName}\n`
				radmsg += `Faction: ${result.faction} (${result.year})\n`
				radmsg += `Strength: ${result.Strength}          Intelligence: ${result.Intelligence}\n`
				radmsg += `Speed: ${result.Speed}               Endurance: ${result.Endurance}\n`
				radmsg += `Rank: ${result.Rank}                 Courage: ${result.Courage}\n`
				radmsg += `Firepower: ${result.Firepower}        Skill: ${result.Skill}\n`
				if(result.Teamwork && result.Cooperation) {
				    radmsg += `Teamwork: ${result.Teamwork}         Cooperation: ${result.Cooperation}\n`
				}
				interaction.reply(radmsg)
			    }
			});
	      },
};
