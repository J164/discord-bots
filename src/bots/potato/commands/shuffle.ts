import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

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

export const command: Command = { data: data, execute: shuffle }