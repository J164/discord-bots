import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'end',
    description: 'End the current Magic game'
}

function end(interaction: CommandInteraction, info: KrenkoGuildInputManager): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    return { embeds: [ info.game.finishGame() ] }
}

module.exports = new BaseCommand(data, end)