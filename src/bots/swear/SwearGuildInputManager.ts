import { Guild, Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { home, sysData, userData } from '../../core/common'
import { SwearVoiceManager } from './SwearVoiceManager'

export class SwearGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '?'
    public readonly voiceManager: SwearVoiceManager

    public constructor(guild: Guild) {
        super(guild)
        this.voiceManager = new SwearVoiceManager()
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (message.author.bot || !message.guild) {
            return null
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

    private async parseCommand(message: Message): Promise<MessageEmbed | string> {
        switch (message.content.split(' ')[0].slice(1).toLowerCase()) {
            case 'play':
                return this.play(message)
            case 'loop':
                return
            case 'pause':
                if (this.voiceManager.pause()) {
                    return 'Paused!'
                }
                return 'Nothing is playing!'
            case 'resume':
                if (this.voiceManager.resume()) {
                    return 'Resumed!'
                }
                return 'Nothing is playing!'
            case 'stop':
                this.voiceManager.reset()
                return 'Success'
            default:
                return 'Command not recognized'
        }
    }

    private async play(message: Message) {
        let songNum
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel?.joinable) {
            return 'This command can only be used while in a visable voice channel!'
        }
        try {
            if (parseInt(message.content.split(' ')[1]) <= userData.swearSongs.length && parseInt(message.content.split(' ')[1]) > 0) {
                songNum = parseInt(message.content.split(' ')[1]) - 1
            } else {
                songNum = Math.floor(Math.random() * userData.swearSongs.length)
            }
        } catch {
            songNum = Math.floor(Math.random() * userData.swearSongs.length)
        }
        await this.voiceManager.connect(voiceChannel)
        this.voiceManager.destroyDispatcher()
        this.voiceManager.createStream(`${home}/music_files/swear_songs/${userData.swearSongs[songNum]}`)
        this.voiceManager.defineDispatcherFinish()
    }
}