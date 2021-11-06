import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseMagicGame } from '../../../core/modules/games/BaseMagicGame'
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
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof BaseMagicGame) || game.isOver()) {
        return { content: 'There is currently no Magic game in this channel' }
    }
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { content: 'That user is not part of this game!' }
    }
    return { embeds: [ game.changeLife(interaction.options.getUser('player').id, interaction.options.getInteger('amount')) ] }
}

module.exports = { data: data, execute: heal, gameCommand: true }