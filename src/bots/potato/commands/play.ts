import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { searchYoutube } from '../../../core/utils/commonFunctions'
import { config } from '../../../core/utils/constants'
import { GuildInputManager } from '../../../core/GuildInputManager'
import ytdl from 'ytdl-core'
import ytpl from 'ytpl'

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Play a song from Youtube',
    options: [
        {
            name: 'name',
            description: 'The URL or title of the song',
            type: 'STRING',
            required: true
        }
    ]
}

async function play(interaction: CommandInteraction, info: GuildInputManager): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    const arg = interaction.options.getString('name')
    interaction.editReply({ content: 'Boiling potatoes...' })

    let url: string
    if (!arg.match(/(\.|^)youtube\.com\//)) {
        const term = await searchYoutube(arg)
        if (!term) {
            return { content: `No results found for "${arg}"` }
        }
        url = `https://www.youtube.com/watch?v=${term}`
    } else {
        url = arg
    }

    if (url.indexOf('list=') !== -1) {
        try {
            const playlist = await ytpl(`https://youtube.com/playlist?list=${url.substr(url.indexOf('list=') + 5)}`)
            for (const song of playlist.items) {
                info.queueManager.addToQueue(song.durationSec, song.url, song.title, song.id, song.bestThumbnail.url)
                if (!existsSync(`${config.data}/music_files/playback/${song.id}.json`)) {
                    writeFileSync(`${config.data}/music_files/playback/${song.id}.json`, JSON.stringify({
                        duration: song.durationSec,
                        url: song.url,
                        title: song.title,
                        id: song.id,
                        thumbnail: song.bestThumbnail.url
                    }))
                }
            }
        } catch (err) {
            console.log(err)
            return { content: 'Please enter a valid url (private playlists will not work)' }
        }
    } else if (!existsSync(`${config.data}/music_files/playback/${url.split(/[?&]+/)[1].substring(2)}.json`)) {
        try {
            const output = await ytdl.getInfo(url)
            info.queueManager.addToQueue(new Number(output.videoDetails.lengthSeconds).valueOf(), output.videoDetails.video_url, output.videoDetails.title, output.videoDetails.videoId, output.videoDetails.thumbnails[0].url)
            writeFileSync(`${config.data}/music_files/playback/${output.videoDetails.videoId}.json`, JSON.stringify({
                duration: new Number(output.videoDetails.lengthSeconds).valueOf(),
                url: output.videoDetails.video_url,
                title: output.videoDetails.title,
                id: output.videoDetails.videoId,
                thumbnail: output.videoDetails.thumbnails[0].url
            }))
        } catch (err) {
            console.log(err)
            return { content: 'Please enter a valid url (private videos will not work)' }
        }
    } else {
        const output = JSON.parse(readFileSync(`${config.data}/music_files/playback/${url.split(/[?&]+/)[1].substring(2)}.json`, { encoding: 'utf8' }))
        info.queueManager.addToQueue(output.duration, output.url, output.title, output.id, output.thumbnail)
    }

    info.queueManager.bindChannel(<TextChannel> interaction.channel)
    if (!info.queueManager.connect(voiceChannel)) {
        return { content: 'Something went wrong when connecting to voice' }
    }
    return { content: 'Added to queue!' }
}

module.exports = new BaseCommand(data, play)