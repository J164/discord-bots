import { ApplicationCommandDataResolvable, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command } from '../../core/utils/interfaces.js'

const data: ApplicationCommandDataResolvable = {
    name: 'roll',
    description: 'Roll a die',
    options: [ {
        name: 'sides',
        description: 'How many sides on the die (defaults to 6)',
        type: 4,
        // eslint-disable-next-line camelcase
        min_value: 2,
        required: false
    } ]
}

function roll(interaction: CommandInteraction): InteractionReplyOptions {
    const dice = interaction.options.getInteger('sides') ? interaction.options.getInteger('sides') : 6
    interaction.editReply({ embeds: [ generateEmbed('info', { title: `Rolling a ${dice}-sided die...` }) ] })
    const diceResult = generateEmbed('info', { title: `${dice}-sided die result`, fields: [] })
    let chance = 10_000
    while (100 / dice * chance < 1) {
        chance *= 10
    }
    diceResult.fields.push({ name: `${Math.floor(Math.random() * (dice - 1) + 1)}`, value: `The chance of getting this result is about ${Math.round(100 / dice * chance) / chance}%` })
    return { embeds: [ diceResult ] }
}

export const command: Command = { data: data, execute: roll }