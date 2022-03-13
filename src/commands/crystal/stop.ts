import {InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function stop(info: GuildChatCommandInfo): InteractionReplyOptions {
    info.voiceManager.reset()
    return { embeds: [ generateEmbed('success', { title: 'Success' }) ] }
}

export const command = new GuildChatCommand({
    name: 'stop',
    description: 'Stop the song',
}, { respond: stop })