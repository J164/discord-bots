import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function stop(message: Message, info: PotatoGuildInputManager): string {
    info.voiceManager.reset()
    return 'Success'
}

module.exports = new BaseCommand([ 'stop', 'disconnect' ], stop)