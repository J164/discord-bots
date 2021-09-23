import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbed } from '../../../core/utils/commonFunctions'

const data: ApplicationCommandData = {
    name: 'roll',
    description: 'Roll a die',
    options: [ {
        name: 'sides',
        description: 'How many sides on the die (defaults to 6)',
        type: 'INTEGER',
        required: false
    } ]
}

function roll(interaction: CommandInteraction): InteractionReplyOptions {
    let dice = 6
    if (interaction.options.getInteger('sides')) {
        const arg = interaction.options.getInteger('sides')
        if (!isNaN(arg) && arg > 0) {
            dice = arg
        }
    }
    interaction.editReply({ content: `Rolling a ${dice}-sided die...` })
    const diceResult = genericEmbed({ title: `${dice}-sided die result` })
    let chanceMod = 10000
    while (100 / dice * chanceMod < 1) {
        chanceMod *= 10
    }
    diceResult.addField(`${Math.floor(Math.random() * (dice - 1) + 1)}`, `The chance of getting this result is about ${Math.round(100 / dice * chanceMod) / chanceMod}%`)
    return { embeds: [ diceResult ] }
}

module.exports = new BaseCommand(data, roll)