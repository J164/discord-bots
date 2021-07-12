import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

function stop(message: Message, info: SwearGuildInputManager): string {
    info.voiceManager.reset()
    return 'Success'
}

module.exports = new BaseCommand([ 'stop', 'disconnect' ], stop)