import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Disconnects Potato Bot from voice'
}

function stop(interaction: CommandInteraction, info: PotatoGuildInputManager): InteractionReplyOptions {
    info.voiceManager.reset()
    return { content: 'Success' }
}

module.exports = new BaseCommand(data, stop)