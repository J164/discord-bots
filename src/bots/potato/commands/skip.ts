import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'skip',
    description: 'Skip the current song'
}

function skip(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    if (info.getPotatoVoiceManager().skip()) {
        return { content: 'Skipped' }
    }
    return { content: 'There is nothing to skip!' }
}

module.exports = new BaseCommand(data, skip)