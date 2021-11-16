import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'shuffle',
    description: 'Shuffles the song queue'
}

async function shuffle(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    if (await info.queueManager.shuffleQueue()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been shuffled' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to shuffle!' }) ] }
}

module.exports = { data: data, execute: shuffle }