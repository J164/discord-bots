import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'np',
    description: 'Get information on the song currently playing',
}

function nowPlaying(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    return info.queueManager.getNowPlaying()
}

module.exports = new BaseCommand(data, nowPlaying)