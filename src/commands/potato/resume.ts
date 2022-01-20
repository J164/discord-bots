import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

function resume(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    if (info.queueManager.voiceManager.resume()) {
        return { embeds: [ generateEmbed('success', { title: 'Resumed!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'resume',
    description: 'Resume song playback',
}, { respond: resume })