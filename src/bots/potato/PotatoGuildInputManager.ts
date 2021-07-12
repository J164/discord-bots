import { Guild, Message, MessageEmbed, Collection } from 'discord.js'
import { readdirSync } from 'fs'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { sysData, voiceKick } from '../../core/common'
import { PotatoVoiceManager } from './PotatoVoiceManager'

export class PotatoGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '&'
    public readonly voiceManager: PotatoVoiceManager
    private readonly commands: Collection<string, BaseCommand>

    public constructor(guild: Guild) {
        super(guild)
        this.voiceManager = new PotatoVoiceManager()
        this.getUsers()
        this.commands = new Collection<string, BaseCommand>()
        const commandFiles = readdirSync('./src/bots/potato/commands').filter(file => file.endsWith('.js'))

        for (const file of commandFiles) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const command = require(`./commands/${file}`)
            this.commands.set(command.aliases[0], command)
        }
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

    private async parseCommand(message: Message): Promise<MessageEmbed | string | void> {
        const commandName = message.content.split(' ')[0].slice(1).toLowerCase()
        const command = this.commands.get(commandName) || this.commands.find(cmd => cmd.aliases.includes(commandName))

        if (!command) {
            return 'Command not recognized'
        }

        return command.execute(message, this)
    }
}