import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'heal',
    description: 'Increase the life total of a player',
    options: [
        {
            name: 'player',
            description: 'The player to damage',
            type: 'USER',
            required: true
        }
    ]
}

function eliminate(interaction: CommandInteraction, info: KrenkoGuildInputManager): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    return { embeds: [ info.game.eliminate(interaction.options.getUser('player').id) ] }
}

module.exports = new BaseCommand(data, eliminate)