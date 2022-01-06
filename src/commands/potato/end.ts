import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

function end(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof MagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    return { embeds: [ game.finishGame() ] }
}

export const command: Command = { data: {
    name: 'end',
    description: 'End the current Magic game'
}, execute: end, gameCommand: true }