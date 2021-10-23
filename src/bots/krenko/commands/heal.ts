import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'heal',
    description: 'Increase the life total of a player',
    options: [
        {
            name: 'player',
            description: 'The player to damage',
            type: 'USER',
            required: true
        },
        {
            name: 'amount',
            description: 'The amount of damage to deal',
            type: 'INTEGER',
            required: true
        }
    ]
}

function heal(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    if (!info.game.userInGame(interaction.options.getUser('player').id)) {
        return { content: 'That user is not part of this game!' }
    }
    return { embeds: [ info.game.changeLife(interaction.options.getUser('player').id, interaction.options.getInteger('amount')) ] }
}

module.exports = new BaseCommand(data, heal)