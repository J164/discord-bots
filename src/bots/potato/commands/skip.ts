import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

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

export const command: Command = { data: data, execute: skip }