import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Disconnects Potato Bot from voice'
}

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.queueManager.reset()
    return { content: 'Success' }
}

module.exports = { data: data, execute: stop }