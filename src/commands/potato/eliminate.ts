import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function eliminate(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof MagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { embeds: [ generateEmbed('error', { title: 'That user is not part of this game!' }) ] }
    }
    return { embeds: [ game.eliminate(interaction.options.getUser('player').id) ] }
}

export const command: Command = { data: {
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
}, execute: eliminate, gameCommand: true }