import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function clear(message: Message, info: PotatoGuildInputManager): string {
    if (info.voiceManager.clear()) {
        return 'The queue has been cleared'
    }
    return 'There is no queue!'
}

module.exports = new BaseCommand([ 'clear' ], clear)