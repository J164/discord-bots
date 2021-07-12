import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

function pause(message: Message, info: SwearGuildInputManager): string {
    if (info.voiceManager.pause()) {
        return 'Paused!'
    }
    return 'Nothing is playing'
}

module.exports = new BaseCommand([ 'pause' ], pause)