import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'

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

export const command = new ChatCommand({
    name: 'yeet',
    description: 'Ask Yeet Bot to yell YEET!',
    options: [ {
        name: 'power',
        description: 'How powerful the yeet should be',
        type: 'INTEGER',
        minValue: 2,
        maxValue: 1995,
        required: false,
    } ],
}, { respond: yeet })