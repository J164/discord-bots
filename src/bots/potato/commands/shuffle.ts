import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'shuffle',
    description: 'Shuffles the song queue'
}

function shuffle(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.shuffleQueue()) {
        return { content: 'The queue has been shuffled' }
    }
    return { content: 'There is nothing to shuffle!' }
}

module.exports = { data: data, execute: shuffle }