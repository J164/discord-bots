import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Stop the song'
}

function stop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    info.voiceManager.reset()
    return { embeds: [ generateEmbed('success', { title: 'Success' }) ] }
}

module.exports = { data: data, execute: stop }