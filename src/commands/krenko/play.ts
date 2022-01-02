import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { CommanderMagicGame } from '../../core/modules/games/commander-magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Start a game of Magic',
    options: [
        {
            name: 'basic',
            description: 'Start a basic Magic game',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'name',
                    description: 'Name of the game',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'player1',
                    description: 'Player 1',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'player2',
                    description: 'Player 2',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'player3',
                    description: 'Player 3',
                    type: 'USER',
                    required: false
                },
                {
                    name: 'player4',
                    description: 'Player 4',
                    type: 'USER',
                    required: false
                },
            ]
        },
        {
            name: 'commander',
            description: 'Start a commander game',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'name',
                    description: 'Name of the game',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'player1',
                    description: 'Player 1',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'commander1',
                    description: 'Enter the name of player 1\'s commander (if they have multiple, seperate their names with a period)',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'player2',
                    description: 'Player 2',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'commander2',
                    description: 'Enter the name of player 2\'s commander (if they have multiple, seperate their names with a period)',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'player3',
                    description: 'Player 3',
                    type: 'USER',
                    required: false
                },
                {
                    name: 'commander3',
                    description: 'Enter the name of player 3\'s commander (if they have multiple, seperate their names with a period)',
                    type: 'STRING',
                    required: false
                },
                {
                    name: 'player4',
                    description: 'Player 4',
                    type: 'USER',
                    required: false
                },
                {
                    name: 'commander4',
                    description: 'Enter the name of player 4\'s commander (if they have multiple, seperate their names with a period)',
                    type: 'STRING',
                    required: false
                },
            ]
        }
    ]
}

async function play(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
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
        } else {
            break
        }
    }
    if (interaction.options.getSubcommand() === 'basic') {
        const thread = await channel.threads.create({ name: interaction.options.getString('name'), autoArchiveDuration: 60 })
        info.games.set(thread.id, new MagicGame(playerlist, thread))
        thread.send({ embeds: [ (<MagicGame> info.games.get(thread.id)).printStandings() ] })
        return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
    }
    const commanders: string[] = []
    for (let index = 0; index < playerlist.length; index++) {
        if (!interaction.options.getString(`commander${index + 1}`)) {
            return { embeds: [ generateEmbed('error', { title: 'Please enter a commander for each player!' }) ] }
        }
        for (const commander of interaction.options.getString(`commander${index + 1}`).split('.')) {
            commanders.push(commander)
        }
    }
    const thread = await channel.threads.create({ name: interaction.options.getString('name'), autoArchiveDuration: 60 })
    info.games.set(thread.id, new CommanderMagicGame(playerlist, commanders, thread))
    thread.send({ embeds: [ (<CommanderMagicGame> info.games.get(thread.id)).printStandings() ] })
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command: Command = { data: data, execute: play }