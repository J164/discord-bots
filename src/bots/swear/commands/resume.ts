import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'resume',
    description: 'Resume the song'
}

function resume(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    if (info.voiceManager.resume()) {
        return { content: 'Resumed!' }
    }
    return { content: 'Nothing is playing!' }
}

module.exports = new BaseCommand(data, resume)