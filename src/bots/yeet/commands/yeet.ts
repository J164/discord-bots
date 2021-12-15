import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'yeet',
    description: 'Ask Yeet Bot to yell YEET!',
    options: [ {
        name: 'power',
        description: 'How powerful the yeet should be',
        type: 'INTEGER',
        required: false
    } ]
}

function yeet(interaction: CommandInteraction): InteractionReplyOptions {
    if (!interaction.options.getInteger('power')) {
        return { content: 'YEET!' }
    }
    let e = ''
    for (let i = 0; i < interaction.options.getInteger('power'); i++) {
        e += 'E'
        // todo min/max
        if (i > 1995) {
            break
        }
    }
    return { content: `Y${e}T!` }
}

export const command: Command = { data: data, execute: yeet }