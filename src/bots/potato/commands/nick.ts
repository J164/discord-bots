import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'

const data: ApplicationCommandData = {
    name: 'nick',
    description: 'Change the nickname of a server member',
    options: [
        {
            name: 'member',
            description: 'The member whose nickname will change',
            type: 'USER',
            required: true
        },
        {
            name: 'nickname',
            description: 'The member\'s new nickname',
            type: 'STRING',
            required: false
        }
    ]
}

async function nick(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.options.getUser('member'))
    if (interaction.options.getString('nickname')?.length > 32) {
        return { content: 'Too many characters! (nicknames must be 32 characters or less)' }
    }
    try {
        await member.setNickname(interaction.options.getString('nickname'))
    } catch {
        return { content: 'This user\'s permissions are too powerful to perform this action!' }
    }
    return { content: 'Success!' }
}

module.exports = { data: data, execute: nick }