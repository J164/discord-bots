import { CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { Blackjack } from '../../core/modules/games/blackjack.js'
import { Euchre } from '../../core/modules/games/euchre.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

async function euchre(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    //todo test euchre
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
    const thread = await channel.threads.create({ name: interaction.options.getString('name') ?? 'Euchre', autoArchiveDuration: 60 })
    const game = new Euchre(playerlist, thread)
    info.games.set(thread.id, game)
    void game.startRound()
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

async function magic(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
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
    const thread = await channel.threads.create({ name: interaction.options.getString('name') ?? 'Magic', autoArchiveDuration: 60 })
    info.games.set(thread.id, new MagicGame(playerlist, thread, interaction.options.getNumber('life') ?? 20))
    await thread.send({ embeds: [ (<MagicGame> info.games.get(thread.id)).printStandings() ] })
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

async function blackjack(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const channel = await interaction.guild.channels.fetch(interaction.channelId)
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const thread = await channel.threads.create({ name: interaction.options.getString('name') ?? 'Blackjack', autoArchiveDuration: 60 })
    info.games.set(thread.id, new Blackjack(thread))
    void (<Blackjack> info.games.get(thread.id)).play()
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

async function card(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    switch (interaction.options.getSubcommand()) {
        case 'euchre':
            return euchre(interaction, info)
        case 'magic':
            return magic(interaction, info)
        case 'blackjack':
            return blackjack(interaction, info)
    }
}

export const command: Command = { data: {
    name: 'card',
    description: 'Play a card game',
    options: [
        {
            name: 'euchre',
            description: 'Play Euchre',
            type: 'SUB_COMMAND',
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
        },
        {
            name: 'magic',
            description: 'Start a game of Magic: The Gathering',
            type: 'SUB_COMMAND',
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
        },
        {
            name: 'blackjack',
            description: 'Play Blackjack',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'name',
                    description: 'Name of this game',
                    type: 'STRING',
                    required: false,
                },
            ],
        },
    ],
}, execute: card }
