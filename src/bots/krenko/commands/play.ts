import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { BaseMagicGame } from '../../../core/modules/games/BaseMagicGame'
import { CommanderMagicGame } from '../../../core/modules/games/CommanderMagicGame'
import { GuildInfo } from '../../../core/utils/interfaces'

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

function play(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const playerlist: User[] = []
    for (let i = 1; i <= 4; i++) {
        if (interaction.options.getUser(`player${i}`)) {
            playerlist.push(interaction.options.getUser(`player${i}`))
        } else {
            break
        }
    }
    if (interaction.options.getSubcommand() === 'basic') {
        info.game = new BaseMagicGame(playerlist)
    } else {
        const commanders: string[] = []
        for (let i = 0; i < playerlist.length; i++) {
            if (!interaction.options.getString(`commander${i + 1}`)) {
                return { content: 'Please enter a commander for each player' }
            }
            for (const commander of interaction.options.getString(`commander${i + 1}`).split('.')) {
                commanders.push(commander)
            }
        }
        info.game = new CommanderMagicGame(playerlist, commanders)
    }
    return { embeds: [ info.game.printStandings() ] }
}

module.exports = { data: data, execute: play }