import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function nowPlaying(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    return info.queueManager.nowPlaying
}

export const command: Command = { data: {
    name: 'np',
    description: 'Get information on the song currently playing',
}, execute: nowPlaying }