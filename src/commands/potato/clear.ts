import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function clear(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.clear()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been cleared' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is no queue!' }) ] }
}

export const command: Command = { data: {
    name: 'clear',
    description: 'Clear the song queue',
}, execute: clear }