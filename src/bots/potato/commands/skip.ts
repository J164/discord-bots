import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'skip',
    description: 'Skip the current song'
}

function skip(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.skip()) {
        return { embeds: [ generateEmbed('success', { title: 'Skipped' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to skip!' }) ] }
}

module.exports = { data: data, execute: skip }