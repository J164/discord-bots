import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'shuffle',
    description: 'Shuffles the song queue'
}

function shuffle(interaction: CommandInteraction, info: PotatoGuildInputManager): InteractionReplyOptions {
    if (info.voiceManager.shuffleQueue()) {
        return { content: 'The queue has been shuffled' }
    }
    return { content: 'There is nothing to shuffle!' }
}

module.exports = new BaseCommand(data, shuffle)