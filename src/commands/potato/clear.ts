import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'clear',
    description: 'Clear the song queue'
}

function clear(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.clear()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been cleared' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is no queue!' }) ] }
}

export const command: Command = { data: data, execute: clear }