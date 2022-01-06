import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function resume(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.voiceManager.resume()) {
        return { embeds: [ generateEmbed('success', { title: 'Resumed!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing!' }) ] }
}

export const command: Command = { data: {
    name: 'resume',
    description: 'Resume song playback'
}, execute: resume }