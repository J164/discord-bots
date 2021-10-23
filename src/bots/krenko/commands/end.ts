import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'end',
    description: 'End the current Magic game'
}

function end(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (!info.game?.isActive) {
        return { content: 'There is currently no active game' }
    }
    return { embeds: [ info.game.finishGame() ] }
}

module.exports = new BaseCommand(data, end)