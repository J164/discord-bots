import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import { request } from 'undici'
import ytdl from 'ytdl-core'
import ytsr from 'ytsr'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'
import { QueueItem } from '../../../core/voice/QueueManager'

const data: ApplicationCommandData = {
    name: 'spotify',
    description: 'Play a playlist from spotify',
    options: [
        {
            name: 'url',
            description: 'The url of the playlist',
            type: 'STRING',
            required: true
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

async function spotify(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    if (!interaction.options.getString('url').match(/^(https:\/\/)*open.spotify.com\/playlist\//)) {
        return { embeds: [ generateEmbed('error', { title: 'Please enter a Spotify playlist url!' }) ] }
    }

    interaction.channel.send({ embeds: [ generateEmbed('info', { title: 'This command is deprecated! (Please use \'play\' instead)' }) ] })

    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { embeds: [ generateEmbed('error', { title: 'This command can only be used while in a visable voice channel!' }) ] }
    }

    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Boiling potatoes...' }) ] })

    const parsedUrl = interaction.options.getString('url').split('?')[0].split('/')
    const playlistId = parsedUrl[interaction.options.getString('url').split('/').indexOf('playlist') + 1]

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
    info.queueManager.bindChannel(<TextChannel> interaction.channel)
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

module.exports = { data: data, execute: spotify }