import { InteractionReplyOptions, User } from 'discord.js'
import { playMagic } from '../../core/modules/games/magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function magic(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    const channel = await info.interaction.guild.channels.fetch(info.interaction.channelId)
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const playerlist: User[] = []
    for (let index = 1; index <= 4; index++) {
        if (info.interaction.options.getUser(`player${index}`)) {
            playerlist.push(info.interaction.options.getUser(`player${index}`))
        } else {
            break
        }
    }
    playMagic(playerlist, info.interaction.options.getNumber('life') ?? 20, await channel.threads.create({ name: info.interaction.options.getString('name') ?? 'Magic', autoArchiveDuration: 60 }))
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'magic',
    description: 'Start a game of Magic: The Gathering',
    options: [
        {
            name: 'player1',
            description: 'Player 1',
            type: 'USER',
            required: true,
        },
        {
            name: 'player2',
            description: 'Player 2',
            type: 'USER',
            required: true,
        },
        {
            name: 'player3',
            description: 'Player 3',
            type: 'USER',
            required: false,
        },
        {
            name: 'player4',
            description: 'Player 4',
            type: 'USER',
            required: false,
        },
        {
            name: 'life',
            description: 'Starting life total',
            type: 'NUMBER',
            minValue: 1,
            required: false,
        },
        {
            name: 'name',
            description: 'Name of the game',
            type: 'STRING',
            required: false,
        },
    ],
}, { respond: magic })