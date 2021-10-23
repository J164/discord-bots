import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

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

function eliminate(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    if (!info.game.userInGame(interaction.options.getUser('player').id)) {
        return { content: 'That user is not part of this game!' }
    }
    return { embeds: [ info.game.eliminate(interaction.options.getUser('player').id) ] }
}

module.exports = { data: data, execute: eliminate }