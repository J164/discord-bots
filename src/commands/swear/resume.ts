import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

function resume(info: GuildChatCommandInfo): InteractionReplyOptions {
    if (info.voiceManager.resume()) {
        return { embeds: [ generateEmbed('success', { title: 'Resumed!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'resume',
    description: 'Resume the song',
}, { respond: resume })