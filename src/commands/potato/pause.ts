import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

function pause(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    if (info.queueManager.voiceManager.pause()) {
        return { embeds: [ generateEmbed('success', { title: 'Paused!' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'Nothing is playing' }) ] }
}

export const command = new GuildChatCommand({
    name: 'pause',
    description: 'Pause the song',
}, { respond: pause })