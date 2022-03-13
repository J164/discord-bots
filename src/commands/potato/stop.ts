import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function stop(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    await info.queueManager.reset()
    return { embeds: [ generateEmbed('success', { title: 'Success' }) ] }
}

export const command = new GuildChatCommand({
    name: 'stop',
    description: 'Disconnects Potato Bot from voice',
}, { respond: stop })