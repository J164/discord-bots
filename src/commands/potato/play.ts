import { ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions, VoiceChannel } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import ytsr from 'ytsr'
import { generateEmbed } from '../../core/utils/generators.js'
import ytpl from 'ytpl'
import { QueueItem } from '../../core/voice/queue-manager.js'
import { request } from 'undici'
import process from 'node:process'

interface SpotifyResponse {
    readonly name: string
    readonly external_urls: { readonly spotify: string }
    readonly images: readonly { readonly url: string }[]
    readonly tracks: { readonly items: readonly { readonly track: { readonly name: string, readonly artists: readonly { readonly name: string }[] } }[] }
}

async function spotify(interaction: CommandInteraction, info: GuildInfo, voiceChannel: VoiceChannel): Promise<InteractionReplyOptions> {
    const parsedUrl = interaction.options.getString('name').split('?')[0].split('/')
    const playlistId = parsedUrl[interaction.options.getString('name').split('/').indexOf('playlist') + 1]

    const token = (<{ access_token: string }> await (await request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${process.env.SPOTIFYAUTH}`, 'Content-Type' : 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials' }))
    .body.json()).access_token

    let response: SpotifyResponse
    try {
        response = <SpotifyResponse> await (await request(`https://api.spotify.com/v1/playlists/${playlistId}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })).body.json()
    } catch {
        return { embeds: [ generateEmbed('error', { title: 'Playlist not found! (Make sure it is a public playlist)' }) ] }
    }

    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Locating Songs...' }) ] })

    const items: QueueItem[] = []

    for (const song of response.tracks.items) {
        const filter = (await ytsr.getFilters(`${song.track.name} ${song.track.artists[0].name}`)).get('Type').get('Video')
        const term = await ytsr(filter.url, { limit: 1 })
        if (term.results < 1) {
            void interaction.channel.send({ embeds: [ generateEmbed('error', { title: `No results found for "${song.track.name}"` }) ] })
            continue
        }
        const ytvideo = <ytsr.Video> term.items[0]
        items.push({ url: ytvideo.url, title: ytvideo.title, duration: ytvideo.duration, thumbnail: ytvideo.bestThumbnail.url })
    }

    await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
    await info.queueManager.connect(voiceChannel)

    return { embeds: [ generateEmbed('success', {
        title: `Added "${response.name}" to queue!`,
        fields: [ {
            name: 'URL:',
            value: response.external_urls.spotify,
         } ],
        image: { url: response.images[0].url },
    } ) ] }
}

async function play(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    const url = interaction.options.getString('name')

    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Boiling potatoes...' }) ] })

    if (/^(https:\/\/)?open\.spotify\.com\/playlist\//.test(url)) {
        return spotify(interaction, info, voiceChannel)
    }

    if (/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/playlist/.test(url)) {
        const results = await ytpl(url).catch((): false => {
            void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] })
            return false
        })
        if (!results) return
        const items: QueueItem[] = []
        for (const item of results.items) {
            items.push({ url: item.shortUrl, title: item.title, duration: item.duration, thumbnail: item.bestThumbnail.url })
        }
        await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
        await info.queueManager.connect(voiceChannel)
        return { embeds: [ generateEmbed('success', { title: `Added playlist "${results.title}" to queue!`, image: { url: results.bestThumbnail.url } }) ] }
    }

    if (!/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url)) {
        const filter = (await ytsr.getFilters(url)).get('Type').get('Video')
        const term = await ytsr(filter.url, {
            limit: 1,
        })
        if (term.results < 1) {
            return { embeds: [ generateEmbed('error', { title: `No results found for "${url}"` }) ] }
        }
        const result = (<ytsr.Video> term.items[0])
        await info.queueManager.addToQueue([ { url: result.url, title: result.title, duration: result.duration, thumbnail: result.bestThumbnail.url } ], interaction.options.getInteger('position') - 1)
        await info.queueManager.connect(voiceChannel)
        return { embeds: [ generateEmbed('success', { title: `Added "${result.title}" to queue!`, image: { url: result.bestThumbnail.url } }) ] }
    }

    const result = (<ytsr.Video> (await ytsr(url, { limit: 1 })).items[0])
    await info.queueManager.addToQueue([ { url: result.url, title: result.title, thumbnail: result.bestThumbnail.url, duration: result.duration } ], interaction.options.getInteger('position') - 1)
    await info.queueManager.connect(voiceChannel)
    return { embeds: [ generateEmbed('success', { title: `Added "${result.title}" to queue!`, image: { url: result.bestThumbnail.url } }) ] }
}

async function search(option: ApplicationCommandOptionChoice): Promise<ApplicationCommandOptionChoice[]> {
    if ((<string> option.value).length < 3 || (/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//).test(<string> option.value) || (/^(https:\/\/)?open\.spotify\.com\/playlist\//).test(<string> option.value)) {
        return
    }
    const filter = (await ytsr.getFilters(<string> option.value)).get('Type').get('Video')
    const results = await ytsr(filter.url, { limit: 4 }).catch((): { items: [] } => { return { items: [] } })
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of <ytsr.Video[]> results.items) {
        options.push({ name: result.title, value: result.url })
    }
    return options
}

export const command: Command = { data: {
    name: 'play',
    description: 'Play a song',
    options: [
        {
            name: 'name',
            description: 'The URL or title of the song',
            type: 'STRING',
            required: true,
            autocomplete: true,
        },
        {
            name: 'position',
            description: 'Where in the queue to put the song (defaults to the end)',
            type: 'INTEGER',
            minValue: 1,
            required: false,
        },
    ],
}, execute: play, autocomplete: search, guildOnly: true, ephemeral: true }
