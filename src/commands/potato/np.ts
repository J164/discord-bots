import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { Info } from '../../core/utils/interfaces.js'

function nowPlaying(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    return info.queueManager.nowPlaying
}

export const command = new GuildChatCommand({
    name: 'np',
    description: 'Get information on the song currently playing',
}, { respond: nowPlaying })