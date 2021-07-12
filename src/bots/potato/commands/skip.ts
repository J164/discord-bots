import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function skip(message: Message, info: PotatoGuildInputManager): string {
    if (info.voiceManager.skip()) {
        return 'Skipped'
    }
    return 'There is nothing to skip!'
}

module.exports = new BaseCommand([ 'skip' ], skip)