import { Message, TextChannel } from 'discord.js'
import { existsSync, readFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { searchYoutube, home } from '../../../core/common'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

async function play(message: Message, info: PotatoGuildInputManager): Promise<string> {
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel?.joinable) {
        return 'This command can only be used while in a visable voice channel!'
    }
    if (message.content.split(' ').length < 2) {
        return 'Please enter a video url or search terms when using this command'
    }
    let url = message.content.split(' ')[1]
    switch (url.toLowerCase()) {
        case 'epic':
            url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2'
            break
        case 'magic':
            url = 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl'
            break
        case 'undertale':
            url = 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x'
            break
        case 'fun':
            url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD'
            break
        default:
            break
    }
    message.channel.send('Boiling potatoes...')
    if (!url.match(/(\.|^)youtube\.com\//)) {
        const arg = message.content.split(' ')
        arg.shift()
        const term = await searchYoutube(arg.join(' '))
        if (!term) {
            return `No results found for '${arg.join(' ')}'`
        }
        url = `https://www.youtube.com/watch?v=${term}`
    }
    let output
    if (url.split(/[?&]+/)[1].startsWith('list') || !existsSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`)) {
        try {
            output = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noCallHome: true,
                noCheckCertificate: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true,
                ignoreErrors: true,
                geoBypass: true,
                noPlaylist: true,
                flatPlaylist: true
            })
        } catch (err) {
            console.log(err)
            return 'Please enter a valid url'
        }
    } else {
        output = JSON.parse(readFileSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`, { encoding: 'utf8' }))
    }
    if ('entries' in output) {
        for (const entry of output.entries) {
            let data
            if (existsSync(`${home}/music_files/playback/${entry.id}.json`)) {
                data = JSON.parse(readFileSync(`${home}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }))
            } else {
                data = entry
            }
            info.voiceManager.addToQueue(data.duration, `https://www.youtube.com/watch?v=${data.id}`, data.title, data.id, data?.thumbnail)
        }
    } else {
        info.voiceManager.addToQueue(output.duration, output.webpage_url, output.title, output.id, output?.thumbnail)
    }
    info.voiceManager.bindChannel(<TextChannel> message.channel)
    info.voiceManager.connect(voiceChannel)
    return 'Added to queue!'
}

module.exports = new BaseCommand([ 'play' ], play)