import { InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function loop(info: GuildChatCommandInfo): InteractionReplyOptions {
    if (info.interaction.options.getSubcommand() === 'current') {
        return { embeds: [ info.queueManager.loopSong() ] }
    }
    return { embeds: [ info.queueManager.loopQueue() ] }
}

export const command = new GuildChatCommand({
    name: 'loop',
    description: 'Loop the current song or queue',
    options: [
        {
            name: 'current',
            description: 'Loop just the current song',
            type: 'SUB_COMMAND',
        },
        {
            name: 'queue',
            description: 'Loop the entire queue',
            type: 'SUB_COMMAND',
        },
    ],
}, { respond: loop })