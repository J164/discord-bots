import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function resume(message: Message, info: PotatoGuildInputManager): string {
    if (info.voiceManager.resume()) {
        return 'Resumed!'
    }
    return 'Nothing is playing!'
}

module.exports = new BaseCommand([ 'resume' ], resume)