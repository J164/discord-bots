import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function pause(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.voiceManager.pause()) {
        return { embeds: [ generateEmbed('success', { title: 'Paused!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing' }) ] }
}

export const command: Command = { data: {
    name: 'pause',
    description: 'Pause the song',
}, execute: pause, guildOnly: true }