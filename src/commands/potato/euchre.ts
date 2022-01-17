import { CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { playEuchre } from '../../core/modules/games/euchre.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command } from '../../core/utils/interfaces.js'

async function euchre(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    //todo test
    const channel = await interaction.guild.channels.fetch(interaction.channelId)
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const playerlist: User[] = []
    for (let index = 1; index <= 4; index++) {
        if (interaction.options.getUser(`player${index}`)) {
            playerlist.push(interaction.options.getUser(`player${index}`))
        }
    }
    playEuchre(playerlist, await channel.threads.create({ name: interaction.options.getString('name') ?? 'Euchre', autoArchiveDuration: 60 }))
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command: Command = { data: {
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
}, execute: euchre, guildOnly: true}