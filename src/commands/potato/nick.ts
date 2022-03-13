import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function nick(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    const member = await info.interaction.guild.members.fetch(info.interaction.options.getUser('member'))
    if (info.interaction.options.getString('nickname')?.length > 32) {
        return { embeds: [ generateEmbed('error', { title: 'Too many characters! (nicknames must be 32 characters or less)' }) ] }
    }
    try {
        await member.setNickname(info.interaction.options.getString('nickname'))
    } catch {
        return { embeds: [ generateEmbed('error', { title: 'This user\'s permissions are too powerful to perform this action!' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'nick',
    description: 'Change the nickname of a server member',
    options: [
        {
            name: 'member',
            description: 'The member whose nickname will change',
            type: 'USER',
            required: true,
        },
        {
            name: 'nickname',
            description: 'The member\'s new nickname',
            type: 'STRING',
            required: false,
        },
    ],
}, { respond: nick })