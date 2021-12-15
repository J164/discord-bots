import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'np',
    description: 'Get information on the song currently playing',
}

function nowPlaying(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    return info.queueManager.getNowPlaying()
}

export const command: Command = { data: data, execute: nowPlaying }