import { InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function nowPlaying(info: GuildChatCommandInfo): InteractionReplyOptions {
    return { embeds: [ info.queueManager.nowPlaying ] }
}

export const command = new GuildChatCommand({
    name: 'np',
    description: 'Get information on the song currently playing',
}, { respond: nowPlaying })