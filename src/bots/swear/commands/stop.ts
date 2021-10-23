import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Stop the song'
}

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.voiceManager.reset()
    return { content: 'Success' }
}

module.exports = { data: data, execute: stop }