import { Collection, Guild, Message } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { config } from '../../core/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { VoiceManager } from '../../core/VoiceManager'

export class SwearGuildInputManager extends BaseGuildInputManager {

    public readonly voiceManager: VoiceManager
    public readonly database: DatabaseManager

    public constructor(guild: Guild, commands: Collection<string, BaseCommand>, database: DatabaseManager) {
        super(guild, commands)
        this.voiceManager = new VoiceManager()
        this.database = database
    }

    public parseGenericMessage(message: Message): void {
        if (!message.guild || message.author.bot) {
            return
        }

        const input = message.content.toLowerCase()
        if (input.match(/(\W|^)swear(\W|$)/)) {
            message.reply(config.blacklist.swears[Math.floor(Math.random() * config.blacklist.swears.length)])
            return
        }
        for (const swear of config.blacklist.swears) {
            if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
                message.reply('Good job swearing! Hell yeah!')
                return
            }
        }
    }
}