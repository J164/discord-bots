import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function skip(info: GuildChatCommandInfo): InteractionReplyOptions {
    if (info.queueManager.skip()) {
        return { embeds: [ generateEmbed('success', { title: 'Skipped' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to skip!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'skip',
    description: 'Skip the current song',
}, { respond: skip })