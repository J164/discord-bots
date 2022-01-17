import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

async function shuffle(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    if (await info.queueManager.shuffleQueue()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been shuffled' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to shuffle!' }) ] }
}

export const command: Command = { data: {
    name: 'shuffle',
    description: 'Shuffles the song queue',
}, execute: shuffle, guildOnly: true }