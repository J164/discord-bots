import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions, VoiceChannel } from 'discord.js'
import ytdl from 'ytdl-core'
import ytpl from 'ytpl'
import { GuildInfo } from '../../../core/utils/interfaces'
import ytsr from 'ytsr'
import { generateEmbed } from '../../../core/utils/generators'
import { request } from 'undici'
import { QueueItem } from '../../../core/voice/QueueManager'

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Play a song from Youtube',
    options: [
        {
            name: 'name',
            description: 'The URL or title of the song',
            type: 'STRING',
            required: true,
            autocomplete: true
        },
        {
            name: 'position',
            description: 'Where in the queue to put the song (defaults to the end)',
            type: 'INTEGER',
            required: false
        }
    ]
}

interface SpotifyResponse {
    external_urls: { spotify: string },
    images: { url: string }[],
    name: string,
    tracks: { items: { track: {
        name: string,
        artists: { name: string }[]
    } }[] }
}

async function spotify(interaction: CommandInteraction, info: GuildInfo, voiceChannel: VoiceChannel): Promise<InteractionReplyOptions> {
    const parsedUrl = interaction.options.getString('name').split('?')[0].split('/')
    const playlistId = parsedUrl[interaction.options.getString('name').split('/').indexOf('playlist') + 1]

    const token = (await (await request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${process.env.spotifyAuth}`, 'Content-Type' : 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials' }))
    .body.json()).access_token

    let response: SpotifyResponse
    try {
        response = await (await request(`https://api.spotify.com/v1/playlists/${playlistId}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })).body.json()
    } catch (err) {
        return { embeds: [ generateEmbed('error', { title: 'Playlist not found! (Make sure it is a public playlist)' }) ] }
    }

    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Locating Songs...' }) ] })

    const urls: string[] = []

    for (const song of response.tracks.items) {
        const term = await ytsr(`${song.track.name} ${song.track.artists[0].name}`, {
            limit: 3
        })
        if (term.results < 1) {
            interaction.channel.send({ embeds: [ generateEmbed('error', { title: `No results found for "${song.track.name}"` }) ] })
            continue
        }
        urls.push((<ytsr.Video> term.items.filter(result => result.type === 'video')[0]).url)
    }

    const items: QueueItem[] = []

    for (const url of urls) {
        const output = await ytdl.getInfo(url)
        items.push({ url: output.videoDetails.video_url, title: output.videoDetails.title, thumbnail: output.videoDetails.thumbnails[0].url, duration: new Number(output.videoDetails.lengthSeconds).valueOf() })
    }

    await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }

    return { embeds: [ generateEmbed('success', {
        title: `Added "${response.name}" to queue!`,
        fields: [ {
            name: 'URL:',
            value: response.external_urls.spotify
         } ],
        image: { url: response.images[0].url }
    } ) ] }
}

async function play(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    const arg = interaction.options.getString('name')
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Boiling potatoes...' }) ] })

    let url: string

    if (arg.match(/^(https:\/\/)?open\.spotify\.com\/playlist\//)) {
        return spotify(interaction, info, voiceChannel)
    }

    if (!arg.match(/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//)) {
        const term = await ytsr(arg, {
            limit: 5
        })
        if (term.results < 1) {
            return { embeds: [ generateEmbed('error', { title: `No results found for "${arg}"` }) ] }
        }
        url = (<ytsr.Video> term.items.filter(result => result.type === 'video')[0]).url
    }

    url ??= arg

    if (url.indexOf('list=') !== -1) {
        try {
            const playlist = await ytpl(`https://youtube.com/playlist?list=${url.substr(url.indexOf('list=') + 5)}`)
            const items = []
            for (const song of playlist.items) {
                items.push({ url: song.url, title: song.title, thumbnail: song.bestThumbnail.url, duration: song.durationSec })
            }
            await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
        } catch (err) {
            console.warn(err)
            return { embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] }
        }
    } else {
        try {
            const output = await ytdl.getInfo(url)
            await info.queueManager.addToQueue([ { url: output.videoDetails.video_url, title: output.videoDetails.title, thumbnail: output.videoDetails.thumbnails[0].url, duration: new Number(output.videoDetails.lengthSeconds).valueOf() } ], interaction.options.getInteger('position') - 1)
        } catch (err) {
            console.warn(err)
            return { embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] }
        }
    }

    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: 'Added to queue!' }) ] }
}

async function search(option: ApplicationCommandOptionChoice): Promise<ApplicationCommandOptionChoice[]> {
    if ((<string> option.value).length < 3 || (<string> option.value).match(/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//) || (<string> option.value).match(/^(https:\/\/)?open\.spotify\.com\/playlist\//)) {
        return
    }
    const results = await ytsr(<string> option.value, { limit: 5 }).catch((): { items: [] } => { return { items: [] } })
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of results.items) {
        if (options.length > 3) {
            break
        }
        if (result.type !== 'video') {
            continue
        }
        options.push({ name: result.title, value: result.url })
    }
    return options
}

module.exports = { data: data, execute: play, autocomplete: search }
