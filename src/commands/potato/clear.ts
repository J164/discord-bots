import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

function clear(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    if (info.queueManager.clear()) {
        return { embeds: [ generateEmbed('success', { title: 'The queue has been cleared' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is no queue!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'clear',
    description: 'Clear the song queue',
}, { respond: clear })