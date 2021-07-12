import { Guild, Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { sysData, voiceKick } from '../../core/common'
import { PotatoVoiceManager } from './PotatoVoiceManager'

export class PotatoGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '&'
    public readonly voiceManager: PotatoVoiceManager

    public constructor(guild: Guild) {
        super(guild, 'potato')
        this.voiceManager = new PotatoVoiceManager()
        this.getUsers()
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (!message.guild) {
            return
        }

        if (message.author.bot) {
            if (message.content.indexOf('Never Gonna Give You Up') !== -1) {
                voiceKick(0, message.member.voice)
            }
            return
        }

        if (!message.content.startsWith(PotatoGuildInputManager.prefix)) {
            return this.genericMessageParse(message)
        }

        return this.parseCommand(message)
    }

    private genericMessageParse(message: Message): void {
        let mentionPotato = false
        let mentionSwear = false
        let mentionInsult = false
        const input = message.content.toLowerCase()
        if (input.match(/(\W|^)potato(s|es)?(\W|$)/)) {
            mentionPotato = true
        }
        for (const swear of sysData.blacklist.swears) {
            if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
                mentionSwear = true
                break
            }
        }
        for (const insult of sysData.blacklist.insults) {
            if (input.match(new RegExp(`(\\W|^)${insult}(\\W|$)`))) {
                mentionInsult = true
                break
            }
        }
        if (mentionPotato && (mentionSwear || mentionInsult)) {
            message.reply('FOOL! HOW DARE YOU BLASPHEMISE THE HOLY ORDER OF THE POTATOES! EAT POTATOES!', { 'tts': true })
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