import { CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { Euchre } from '../../core/modules/games/euchre-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

async function euchre(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    // todo test
    const channel = await interaction.guild.channels.fetch(interaction.channelId)
    for (const [ , game ] of info.games) {
        if (game.getThreadName() === interaction.options.getString('name')) {
            return { embeds: [ generateEmbed('error', { title: 'Please choose a unique game name!' }) ] }
        }
    }
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const playerlist: User[] = []
    for (let index = 1; index <= 4; index++) {
        if (interaction.options.getUser(`player${index}`)) {
            playerlist.push(interaction.options.getUser(`player${index}`))
        }
    }
    const thread = await channel.threads.create({ name: interaction.options.getString('name'), autoArchiveDuration: 60 })
    const game = new Euchre(playerlist, thread)
    info.games.set(thread.id, game)
    game.startRound()
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

async function blackjack(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const channel = await interaction.guild.channels.fetch(interaction.channelId)
    for (const [ , game ] of info.games) {
        if (game.getThreadName() === interaction.options.getString('name')) {
            return { embeds: [ generateEmbed('error', { title: 'Please choose a unique game name!' }) ] }
        }
    }
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    //start game
}

async function card(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const subcommand = interaction.options.getSubcommand()
    if (subcommand === 'euchre') {
        return euchre(interaction, info)
    }
    if (subcommand === 'blackjack') {
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
                    name: 'name',
                    description: 'Name of this game',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'player1',
                    description: 'Player 1 (Team 1)',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'player2',
                    description: 'Player 2 (Team 2)',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'player3',
                    description: 'Player 3 (Team 3)',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'player4',
                    description: 'Player 4 (Team 4)',
                    type: 'USER',
                    required: true
                }
            ]
        }/*,
        {
            name: 'blackjack',
            description: 'Play Blackjack',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'name',
                    description: 'Name of this game',
                    type: 'STRING',
                    required: true
                }
            ]
        }*/
    ]
}, execute: card }
