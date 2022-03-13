import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function shuffle(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    if (await info.queueManager.shuffleQueue()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been shuffled' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to shuffle!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'shuffle',
    description: 'Shuffles the song queue',
}, { respond: shuffle })