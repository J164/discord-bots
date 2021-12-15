import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'pause',
    description: 'Pause the song'
}

function pause(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.voiceManager.pause()) {
        return { embeds: [ generateEmbed('success', { title: 'Paused!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing' }) ] }
}

export const command: Command = { data: data, execute: pause }