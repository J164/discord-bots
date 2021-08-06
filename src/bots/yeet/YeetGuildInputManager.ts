import { Collection, Guild, Message } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'

export class YeetGuildInputManager extends BaseGuildInputManager {

    public constructor(guild: Guild, commands: Collection<string, BaseCommand>) {
        super(guild, commands)
    }

    public parseGenericMessage(message: Message): void {
        const input = message.content.toLowerCase()
        if (input.match(/(\W|^)yee+t(\W|$)/)) {
            if (input.substr(input.indexOf('yee') + 1, 10) === 'eeeeeeeeee') {
                message.reply('Wow! Much Yeet!')
                return
            }
            message.reply('YEEEEEEEEEET!')
        }
    }
}