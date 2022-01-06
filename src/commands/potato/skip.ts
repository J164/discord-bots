import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function skip(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.skip()) {
        return { embeds: [ generateEmbed('success', { title: 'Skipped' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to skip!' }) ] }
}

export const command: Command = { data: {
    name: 'skip',
    description: 'Skip the current song'
}, execute: skip }