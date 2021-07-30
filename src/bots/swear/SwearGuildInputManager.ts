import { Collection, Guild, Message } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { sysData } from '../../core/common'
import { DatabaseManager } from '../../core/DatabaseManager'
import { VoiceManager } from '../../core/VoiceManager'

export class SwearGuildInputManager extends BaseGuildInputManager {

    public readonly voiceManager: VoiceManager

    public constructor(guild: Guild, database: DatabaseManager, commands: Collection<string, BaseCommand>) {
        super(guild, database, commands)
        this.voiceManager = new VoiceManager()
    }

    public parseGenericMessage(message: Message): void {
        if (!message.guild || message.author.bot) {
            return
        }

        const input = message.content.toLowerCase()
        if (input.match(/(\W|^)swear(\W|$)/)) {
            message.reply(sysData.blacklist.swears[Math.floor(Math.random() * sysData.blacklist.swears.length)])
            return
        }
        for (const swear of sysData.blacklist.swears) {
            if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
                message.reply('Good job swearing! Hell yeah!')
                return
            }
        }
    }
}