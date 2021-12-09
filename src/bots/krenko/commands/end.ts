import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { MagicGame } from '../../../core/modules/games/MagicGame'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'end',
    description: 'End the current Magic game'
}

function end(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof MagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    return { embeds: [ game.finishGame() ] }
}

module.exports = { data: data, execute: end, gameCommand: true }