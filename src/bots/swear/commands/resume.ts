import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

function resume(message: Message, info: SwearGuildInputManager): string {
    if (info.voiceManager.resume()) {
        return 'Resumed!'
    }
    return 'Nothing is playing!'
}

module.exports = new BaseCommand([ 'resume' ], resume)