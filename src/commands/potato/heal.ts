import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

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
    if (!game || !(game instanceof MagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { embeds: [ generateEmbed('error', { title: 'That user is not part of this game!' }) ] }
    }
    return { embeds: [ game.changeLife(interaction.options.getUser('player').id, interaction.options.getInteger('amount')) ] }
}

export const command: Command = { data: data, execute: heal, gameCommand: true }