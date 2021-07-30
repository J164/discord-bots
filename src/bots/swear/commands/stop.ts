import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Stop the song'
}

function stop(interaction: CommandInteraction, info: SwearGuildInputManager): InteractionReplyOptions {
    info.voiceManager.reset()
    return { content: 'Success' }
}

module.exports = new BaseCommand(data, stop)