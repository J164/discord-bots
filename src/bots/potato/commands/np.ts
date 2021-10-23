import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'np',
    description: 'Get information on the song currently playing',
}

function nowPlaying(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    return info.queueManager.getNowPlaying()
}

module.exports = { data: data, execute: nowPlaying }