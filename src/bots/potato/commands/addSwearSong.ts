import { Message } from 'discord.js'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { home, refreshData, userData } from '../../../core/common'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

async function addSwearSong(message: Message, info: PotatoGuildInputManager): Promise<string> {
    if (message.member !== info.users.get('admin') && message.member !== info.users.get('swear')) {
        return 'You don\'t have permission to use this command!'
    }
    if (message.content.split(' ').length < 2) {
        return 'Please enter a video url'
    }
    message.channel.send('Getting information on new song...')
    const output = await youtubedl(message.content.split(' ')[1], {
        dumpJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        ignoreErrors: true
    })
    if (!output) {
        return 'It appears the video was unavailable'
    }
    if ('entries' in output) {
        return 'Please only enter a single video at a time'
    }
    if (output.duration > 1200) {
        return 'The video length limit is 20 minutes! Aborting...'
    }
    message.channel.send('Downloading...')
    youtubedl(message.content.split(' ')[1], {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/music_files/swear_songs/song${userData.swearSongs.length + 1}.mp3`
    })
    refreshData()
    userData.swearSongs.push(`song${userData.swearSongs.length + 1}.mp3`)
    const jsonString = JSON.stringify(userData)
    writeFileSync(`${home}/sys_files/bots.json`, jsonString)
    return 'Success!'
}

module.exports = new BaseCommand([ 'newsong', 'addsong' ], addSwearSong)