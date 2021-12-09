import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

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

module.exports = { data: data, execute: pause }