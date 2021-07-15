import { Guild, Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { sysData } from '../../core/common'
import { DatabaseManager } from '../../core/DatabaseManager'
import { SwearVoiceManager } from './SwearVoiceManager'

export class SwearGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '?'
    public readonly voiceManager: SwearVoiceManager

    public constructor(guild: Guild, database: DatabaseManager) {
        super(guild, database, 'swear')
        this.voiceManager = new SwearVoiceManager()
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (message.author.bot || !message.guild) {
            return
        }

        if (!message.content.startsWith(SwearGuildInputManager.prefix)) {
            return this.genericMessageParse(message)
        }

        return this.parseCommand(message)
    }

    private genericMessageParse(message: Message): void {
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