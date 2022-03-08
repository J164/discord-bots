import { CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { playMagic } from '../../core/modules/games/magic-game.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'

async function magic(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const channel = await interaction.guild.channels.fetch(interaction.channelId)
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const playerlist: User[] = []
    for (let index = 1; index <= 4; index++) {
        if (interaction.options.getUser(`player${index}`)) {
            playerlist.push(interaction.options.getUser(`player${index}`))
        } else {
            break
        }
    }
    playMagic(playerlist, interaction.options.getNumber('life') ?? 20, await channel.threads.create({ name: interaction.options.getString('name') ?? 'Magic', autoArchiveDuration: 60 }))
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