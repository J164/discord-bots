import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function pause(info: GuildChatCommandInfo): InteractionReplyOptions {
    if (info.queueManager.pause()) {
        return { embeds: [ generateEmbed('success', { title: 'Paused!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing' }) ] }
}

export const command = new GuildChatCommand({
    name: 'pause',
    description: 'Pause the song',
}, { respond: pause })