import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'loop',
    description: 'Loop the current song',
}

function loop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    return info.voiceManager.loop()
}

module.exports = { data: data, execute: loop }