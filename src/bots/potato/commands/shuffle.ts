import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'shuffle',
    description: 'Shuffles the song queue'
}

function shuffle(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    if (info.getPotatoVoiceManager().shuffleQueue()) {
        return { content: 'The queue has been shuffled' }
    }
    return { content: 'There is nothing to shuffle!' }
}

module.exports = new BaseCommand(data, shuffle)