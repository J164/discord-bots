import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { home } from '../../../core/common'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

async function downloadVideo(message: Message, info: PotatoGuildInputManager): Promise<string> {
    if (message.member !== info.users.get('admin')) {
        return 'You don\'t have permission to use this command!'
    }
    if (message.content.split(' ').length < 2) {
        return 'Please enter a video url'
    }
    const options = {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/New Downloads/%(title)s.%(ext)s`,
        ignoreErrors: true
    }
    if (message.content.split(' ').length < 3 || message.content.split(' ')[2][0].toLowerCase() !== 'a') {
        options.format = 'bestvideo,bestaudio'
    }
    message.channel.send('Downloading...')
    await youtubedl(message.content.split(' ')[1], options)
    return 'Download Successful!'
}

module.exports = new BaseCommand([ 'download' ], downloadVideo)