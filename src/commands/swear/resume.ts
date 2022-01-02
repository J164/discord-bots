import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

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

export const command: Command = { data: data, execute: resume }