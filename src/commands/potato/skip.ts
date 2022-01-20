import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

function skip(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    if (info.queueManager.skip()) {
        return { embeds: [ generateEmbed('success', { title: 'Skipped' }) ] }
    }
    return { embeds: [ generateEmbed('error', { title: 'There is nothing to skip!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'skip',
    description: 'Skip the current song',
}, { respond: skip })