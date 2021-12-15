import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { MagicGame } from '../../../core/modules/games/MagicGame.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'standings',
    description: 'Display the standings for the current Magic game'
}

function end(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof MagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    return { embeds: [ game.printStandings() ] }
}

export const command: Command = { data: data, execute: end, gameCommand: true }