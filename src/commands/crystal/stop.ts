import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.voiceManager.reset()
    return { embeds: [ generateEmbed('success', { title: 'Success' }) ] }
}

export const command: Command = { data: {
    name: 'stop',
    description: 'Stop the song'
}, execute: stop }