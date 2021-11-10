import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'resume',
    description: 'Resume the song'
}

function resume(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.voiceManager.resume()) {
        return { embeds: [ generateEmbed('success', { title: 'Resumed!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing!' }) ] }
}

module.exports = { data: data, execute: resume }