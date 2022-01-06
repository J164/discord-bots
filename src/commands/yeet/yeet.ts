import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command } from '../../core/utils/interfaces.js'

function yeet(interaction: CommandInteraction): InteractionReplyOptions {
    if (!interaction.options.getInteger('power')) {
        return { content: 'YEET!' }
    }
    let middle = ''
    for (let index = 0; index < interaction.options.getInteger('power'); index++) {
        middle += 'E'
    }
    return { content: `Y${middle}T!` }
}

export const command: Command = { data: {
    name: 'yeet',
    description: 'Ask Yeet Bot to yell YEET!',
    options: [ {
        name: 'power',
        description: 'How powerful the yeet should be',
        type: 'INTEGER',
        // eslint-disable-next-line camelcase
        min_value: 2,
        // eslint-disable-next-line camelcase
        max_value: 1995,
        required: false
    } ]
}, execute: yeet }