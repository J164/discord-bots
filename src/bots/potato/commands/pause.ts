import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'pause',
    description: 'Pause the song'
}

function pause(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    if (info.getPotatoVoiceManager().pause()) {
        return { content: 'Paused!' }
    }
    return { content: 'Nothing is playing' }
}

module.exports = new BaseCommand(data, pause)