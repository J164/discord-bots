import { InteractionReplyOptions, User } from 'discord.js'
import { playEuchre } from '../../core/modules/games/euchre.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function euchre(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    const channel = await info.interaction.guild.channels.fetch(info.interaction.channelId)
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const playerlist: User[] = []
    for (let index = 1; index <= 4; index++) {
        if (info.interaction.options.getUser(`player${index}`)) {
            playerlist.push(info.interaction.options.getUser(`player${index}`))
        }
    }
    playEuchre(playerlist, await channel.threads.create({ name: info.interaction.options.getString('name') ?? 'Euchre', autoArchiveDuration: 60 }))
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'euchre',
    description: 'Play Euchre',
    options: [
        {
            name: 'player1',
            description: 'Player 1 (Team 1)',
            type: 'USER',
            required: true,
        },
        {
            name: 'player2',
            description: 'Player 2 (Team 2)',
            type: 'USER',
            required: true,
        },
        {
            name: 'player3',
            description: 'Player 3 (Team 3)',
            type: 'USER',
            required: true,
        },
        {
            name: 'player4',
            description: 'Player 4 (Team 4)',
            type: 'USER',
            required: true,
        },
        {
            name: 'name',
            description: 'Name of this game',
            type: 'STRING',
            required: false,
        },
    ],
}, { respond: euchre })