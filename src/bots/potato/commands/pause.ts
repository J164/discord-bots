import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function pause(message: Message, info: PotatoGuildInputManager): string {
    if (info.voiceManager.pause()) {
        return 'Paused!'
    }
    return 'Nothing is playing'
}

module.exports = new BaseCommand([ 'pause' ], pause)