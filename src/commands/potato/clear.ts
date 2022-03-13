import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function clear(info: GuildChatCommandInfo): InteractionReplyOptions {
    if (info.queueManager.clear()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been cleared' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is no queue!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'clear',
    description: 'Clear the song queue',
}, { respond: clear })