import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'skip',
    description: 'Skip the current song'
}

function skip(interaction: CommandInteraction, info: PotatoGuildInputManager): InteractionReplyOptions {
    if (info.voiceManager.skip()) {
        return { content: 'Skipped' }
    }
    return { content: 'There is nothing to skip!' }
}

module.exports = new BaseCommand(data, skip)