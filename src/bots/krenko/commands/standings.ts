import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'standings',
    description: 'Display the standings for the current Magic game'
}

function end(interaction: CommandInteraction, info: KrenkoGuildInputManager): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    return { embeds: [ info.game.printStandings() ] }
}

module.exports = new BaseCommand(data, end)