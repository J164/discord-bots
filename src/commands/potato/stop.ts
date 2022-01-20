import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

function stop(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    info.queueManager.reset()
    return { embeds: [ generateEmbed('success', { title: 'Success' }) ] }
}

export const command = new GuildChatCommand({
    name: 'stop',
    description: 'Disconnects Potato Bot from voice',
}, { respond: stop })