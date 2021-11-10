import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseMagicGame } from '../../../core/modules/games/BaseMagicGame'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'standings',
    description: 'Display the standings for the current Magic game'
}

function end(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof BaseMagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    return { embeds: [ game.printStandings() ] }
}

module.exports = { data: data, execute: end, gameCommand: true }