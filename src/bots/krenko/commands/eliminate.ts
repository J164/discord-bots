import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'eliminate',
    description: 'Eliminate a player',
    options: [
        {
            name: 'player',
            description: 'The player to eliminate',
            type: 'USER',
            required: true
        }
    ]
}

function eliminate(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    return { embeds: [ info.game.eliminate(interaction.options.getUser('player').id) ] }
}

module.exports = new BaseCommand(data, eliminate)