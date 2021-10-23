import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'clear',
    description: 'Clear the song queue'
}

function clear(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.clear()) {
        return { content: 'The queue has been cleared' }
    }
    return { content: 'There is no queue!' }
}

module.exports = { data: data, execute: clear }