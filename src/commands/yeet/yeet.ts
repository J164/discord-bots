import { InteractionReplyOptions } from 'discord.js'
import { GlobalChatCommand, GlobalChatCommandInfo } from '../../core/utils/interfaces.js'

function yeet(info: GlobalChatCommandInfo): InteractionReplyOptions {
    return { content: `Y${'E'.repeat(info.interaction.options.getInteger('power') ?? 2)}T!` }
}

export const command = new GlobalChatCommand({
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
