import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'

function yeet(interaction: CommandInteraction): InteractionReplyOptions {
    return { content: `Y${'E'.repeat(interaction.options.getInteger('power') ?? 2)}T!` }
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