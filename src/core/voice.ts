import { PartialTextBasedChannelFields, Snowflake, VoiceChannel } from "discord.js"
import EventEmitter = require("events")
import { createReadStream, existsSync, unlinkSync, writeFileSync } from "fs"
import { home, genericEmbedResponse, PotatoGuildData } from "./common"
const ffmpeg = require("fluent-ffmpeg")
const youtubedl = require("youtube-dl-exec")

export class QueueItem extends EventEmitter {
    public readonly webpageUrl: string
    public readonly title: string
    public readonly id: string
    public thumbnail: string
    public readonly duration: number
    private downloading: boolean

    public constructor(webpageUrl: string, title: string, id: string, thumbnail: string, duration: number) {
        super()
        this.webpageUrl = webpageUrl
        this.title = title
        this.id = id
        this.thumbnail = thumbnail
        this.duration = duration
        this.downloading = false
    }

    public isDownloaded(): boolean {
        if (existsSync(`${home}/music_files/playback/${this.id}.json`)) {
            return true
        }
        this.download()
        return false
    }

    public async download(): Promise<void> {
        if (this.downloading) {
            return
        }
        this.downloading = true
        const output = await youtubedl(this.webpageUrl, {
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            ignoreErrors: true,
            geoBypass: true,
            printJson: true,
            format: 'bestaudio',
            output: `${home}/music_files/playback/%(id)s.mp3`
        })
        this.thumbnail = output.thumbnails[0].url
        const metaData = JSON.stringify({
            webpageUrl: this.webpageUrl,
            title: this.title,
            id: this.id,
            thumbnail: this.thumbnail,
            duration: this.duration
        })
        ffmpeg(`${home}/music_files/playback/${this.id}.mp3`)
            .format('ogg')
            .audioBitrate('96k')
            .once('end', () => {
                //unlinkSync(`${home}/music_files/playback/${this.id}.mp3`)
                writeFileSync(`${home}/music_files/playback/${this.id}.json`, metaData)
                this.emit('downloaded')
            })
            .on('error', function(err: any) {
                console.log(err)
            })
            .save(`${home}/music_files/playback/${this.id}.ogg`)
    }
}

export async function connect(channel: PartialTextBasedChannelFields, guildID: Snowflake, vc: VoiceChannel, guildData: PotatoGuildData): Promise<void> {
    if (!vc.joinable || guildData.queue.length < 1) {
        channel.send('Something went wrong!')
        guildData.queue = []
        return
    }
    guildData.audio = true
    guildData.voice = await vc.join()
    checkSongStatus(channel, guildData)
}

export async function checkSongStatus(channel: PartialTextBasedChannelFields, guildData: PotatoGuildData): Promise<void> {
    if (guildData.queue.length < 1) {
        guildData.audio = false
        guildData.singleLoop = false
        guildData.fullLoop = false
        return
    }
    const song = guildData.queue.shift()
    if (!song.isDownloaded()) {
        song.once("downloaded", () => {
            playSong(channel, song, guildData)
        })
        return
    }
    playSong(channel, song, guildData)
}

export async function playSong(channel: PartialTextBasedChannelFields, song: QueueItem, guildData: PotatoGuildData): Promise<void> {
    //const stream = createReadStream(`${home}/music_files/playback/${song.id}.ogg`)
    //stream.once("end", () => console.log('close'))
    guildData.dispatcher = guildData.voice.play(`${home}/music_files/playback/${song.id}.mp3`)//, { type: 'ogg/opus' })
    guildData.nowPlaying = genericEmbedResponse(`Now Playing: ${song.title}`)
    guildData.nowPlaying.setImage(song.thumbnail)
    guildData.nowPlaying.addField('URL:', song.webpageUrl)
    if (!guildData.singleLoop) {
        channel.send(guildData.nowPlaying)
    }
    guildData.dispatcher.once('finish', () => {
        if (guildData.fullLoop) {
            guildData.queue.push(song)
        } else if (guildData.singleLoop) {
            guildData.queue.unshift(song)
        }
        guildData.dispatcher.destroy()
        guildData.audio = false
        checkSongStatus(channel, guildData)
    })
}

export async function download(guildData: PotatoGuildData): Promise<void> {
    if (guildData.downloadQueue.length < 1) {
        guildData.downloading = false
        return
    }
    guildData.downloading = true
    const currentItem = guildData.downloadQueue.shift()
    await currentItem.download()
    currentItem.once("downloaded", () => {
        download(guildData)
    })
}