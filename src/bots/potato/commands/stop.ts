import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Disconnects Potato Bot from voice'
}

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.queueManager.reset()
    return { content: 'Success' }
}

module.exports = new BaseCommand(data, stop)