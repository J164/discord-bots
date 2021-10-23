import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'pause',
    description: 'Pause the song'
}

function pause(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.voiceManager.pause()) {
        return { content: 'Paused!' }
    }
    return { content: 'Nothing is playing' }
}

module.exports = { data: data, execute: pause }