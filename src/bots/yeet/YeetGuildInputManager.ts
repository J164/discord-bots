import { Guild, Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'

export class YeetGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '%'

    public constructor(guild: Guild) {
        super(guild, 'yeet')
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (message.author.bot || !message.guild) {
            return
        }

        if (!message.content.startsWith(YeetGuildInputManager.prefix)) {
            return this.genericMessageParse(message)
        }

        return this.parseCommand(message)
    }

    private genericMessageParse(message: Message): void {
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