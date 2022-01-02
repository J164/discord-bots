import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Disconnects Potato Bot from voice'
}

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.queueManager.reset()
    return { embeds: [ generateEmbed('success', { title: 'Success' }) ] }
}

export const command: Command = { data: data, execute: stop }