import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { userData, home } from '../../../core/common'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

async function play(message: Message, info: SwearGuildInputManager): Promise<string> {
    let songNum
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel?.joinable) {
        return 'info command can only be used while in a visable voice channel!'
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
    await info.voiceManager.connect(voiceChannel)
    info.voiceManager.destroyDispatcher()
    info.voiceManager.createStream(`${home}/music_files/swear_songs/${userData.swearSongs[songNum]}`)
    info.voiceManager.defineDispatcherFinish()
}

module.exports = new BaseCommand([ 'play' ], play)