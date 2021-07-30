import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'
import { Euchre } from '../../../core/modules/games/Euchre'

const data: ApplicationCommandData = {
    name: 'euchre',
    description: 'Play a game of Euchre',
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
            required: true
        },
        {
            name: 'player4',
            description: 'Player 4',
            type: 'USER',
            required: true
        }
    ]
}

async function setupEuchre(interaction: CommandInteraction): Promise<void> {
    const players = genericEmbedResponse('Teams')
    const channel = interaction.channel
    players.addField('Team 1:', `${interaction.options.getUser('player1').username}, ${interaction.options.getUser('player3').username}`)
    players.addField('Team 2:', `${interaction.options.getUser('player2').username}, ${interaction.options.getUser('player4').username}`)
    interaction.editReply({ embeds: [ players ] })
    const game = new Euchre([ interaction.options.getUser('player1'), interaction.options.getUser('player2'), interaction.options.getUser('player3'), interaction.options.getUser('player4') ])
    channel.send({embeds: [ await game.startGame() ] })
}

module.exports = new BaseCommand(data, setupEuchre)