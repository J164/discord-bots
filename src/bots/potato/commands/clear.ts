import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

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

module.exports = { data: data, execute: clear }