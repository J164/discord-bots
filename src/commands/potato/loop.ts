import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function loop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (interaction.options.getSubcommand() === 'current') {
        return info.queueManager.loopSong()
    }
    return info.queueManager.loopQueue()
}

export const command: Command = { data: {
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
}, execute: loop }