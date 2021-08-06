import { Collection, Guild, Message } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { voiceKick } from '../../core/commonFunctions'
import { config } from '../../core/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { PotatoVoiceManager } from './PotatoVoiceManager'

export class PotatoGuildInputManager extends BaseGuildInputManager {

    public readonly voiceManager: PotatoVoiceManager
    public readonly database: DatabaseManager

    public constructor(guild: Guild, commands: Collection<string, BaseCommand>, database: DatabaseManager) {
        super(guild, commands)
        this.voiceManager = new PotatoVoiceManager()
        this.database = database
    }

    public parseGenericMessage(message: Message): void {
        if (!message.guild) {
            return
        }

        if (message.author.bot) {
            if (message.content.indexOf('Never Gonna Give You Up') !== -1) {
                voiceKick(0, message.member.voice)
            }
            return
        }

        let mentionPotato = false
        let mentionSwear = false
        let mentionInsult = false
        const input = message.content.toLowerCase()
        if (input.match(/(\W|^)potato(s|es)?(\W|$)/)) {
            mentionPotato = true
        }
        for (const swear of config.blacklist.swears) {
            if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
                mentionSwear = true
                break
            }
        }
        for (const insult of config.blacklist.insults) {
            if (input.match(new RegExp(`(\\W|^)${insult}(\\W|$)`))) {
                mentionInsult = true
                break
            }
        }
        if (mentionPotato && (mentionSwear || mentionInsult)) {
            message.reply('FOOL! HOW DARE YOU BLASPHEMISE THE HOLY ORDER OF THE POTATOES! EAT POTATOES!')
            message.client.user.setActivity(`Teaching ${message.author.tag} the value of potatoes`, {
                type: 'STREAMING',
                url: 'https://www.youtube.com/watch?v=fLNWeEen35Y'
            })
            return
        }
        if (mentionSwear) {
            for (let i = 0; i < 3; i++) {
                message.channel.send('a')
            }
        }
    }
}