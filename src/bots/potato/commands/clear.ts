import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'clear',
    description: 'Clear the song queue'
}

function clear(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    if (info.getPotatoVoiceManager().clear()) {
        return { content: 'The queue has been cleared' }
    }
    return { content: 'There is no queue!' }
}

module.exports = new BaseCommand(data, clear)