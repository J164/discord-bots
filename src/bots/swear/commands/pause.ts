import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

const data: ApplicationCommandData = {
    name: 'pause',
    description: 'Pause the song'
}

function pause(interaction: CommandInteraction, info: SwearGuildInputManager): InteractionReplyOptions {
    if (info.voiceManager.pause()) {
        return { content: 'Paused!' }
    }
    return { content: 'Nothing is playing' }
}

module.exports = new BaseCommand(data, pause)