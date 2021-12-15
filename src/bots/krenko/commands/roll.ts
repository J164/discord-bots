import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'roll',
    description: 'Roll a die',
    options: [ {
        name: 'sides',
        description: 'How many sides on the die (defaults to 6)',
        type: 'INTEGER',
        required: false
        // todo min/max
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
    interaction.editReply({ embeds: [ generateEmbed('info', { title: `Rolling a ${dice}-sided die...` }) ] })
    const diceResult = generateEmbed('info', { title: `${dice}-sided die result`, fields: [] })
    let chanceMod = 10000
    while (100 / dice * chanceMod < 1) {
        chanceMod *= 10
    }
    diceResult.fields.push({ name: `${Math.floor(Math.random() * (dice - 1) + 1)}`, value: `The chance of getting this result is about ${Math.round(100 / dice * chanceMod) / chanceMod}%` })
    return { embeds: [ diceResult ] }
}

export const command: Command = { data: data, execute: roll }