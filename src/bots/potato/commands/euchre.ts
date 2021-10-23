import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { genericEmbed } from '../../../core/utils/commonFunctions'
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

async function setupEuchre(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    return { content: 'This command is currently under construction!' }
    const players = genericEmbed({
        title: 'Teams',
        fields: [
            {
                name: 'Team 1:',
                value: `${interaction.options.getUser('player1').username}, ${interaction.options.getUser('player3').username}`
            },
            {
                name: 'Team 2:',
                value: `${interaction.options.getUser('player2').username}, ${interaction.options.getUser('player4').username}`
            }
        ]
    })
    interaction.editReply({ embeds: [ players ] })
    const game = new Euchre([ interaction.options.getUser('player1'), interaction.options.getUser('player2'), interaction.options.getUser('player3'), interaction.options.getUser('player4') ])
    interaction.channel.send({embeds: [ await game.startGame() ] })
}

module.exports = { data: data, execute: setupEuchre }