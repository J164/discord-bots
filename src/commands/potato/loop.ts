import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { Info } from '../../core/utils/interfaces.js'

function loop(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    if (interaction.options.getSubcommand() === 'current') {
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