import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function shuffle(message: Message, info: PotatoGuildInputManager): string {
    if (info.voiceManager.shuffleQueue()) {
        return 'The queue has been shuffled'
    }
    return 'There is nothing to shuffle!'
}

module.exports = new BaseCommand([ 'shuffle' ], shuffle)