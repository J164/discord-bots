import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Stop the song'
}

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.voiceManager.reset()
    return { content: 'Success' }
}

module.exports = new BaseCommand(data, stop)