import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'resume',
    description: 'Resume the song'
}

function resume(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.voiceManager.resume()) {
        return { content: 'Resumed!' }
    }
    return { content: 'Nothing is playing!' }
}

module.exports = new BaseCommand(data, resume)