import { ApplicationCommandOptionChoice, InteractionReplyOptions, VoiceChannel } from 'discord.js'
import { GuildAutocompleteInfo, GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'
import ytsr from 'ytsr'
import { generateEmbed } from '../../core/utils/generators.js'
import ytpl from 'ytpl'
import { QueueItem } from '../../core/voice/queue-manager.js'
import { request } from 'undici'
import process from 'node:process'
import { resolve } from '../../core/modules/ytdl.js'

interface SpotifyResponse {
    readonly name: string
    readonly external_urls: { readonly spotify: string }
    readonly images: readonly { readonly url: string }[]
    readonly tracks: { readonly items: readonly { readonly track: { readonly name: string, readonly artists: readonly { readonly name: string }[] } }[] }
}

async function spotify(info: GuildChatCommandInfo, voiceChannel: VoiceChannel): Promise<InteractionReplyOptions> {
    const parsedUrl = info.interaction.options.getString('name').split('?')[0].split('/')
    const playlistId = parsedUrl[info.interaction.options.getString('name').split('/').indexOf('playlist') + 1]

    const token = (await (await request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${process.env.SPOTIFYAUTH}`, 'Content-Type' : 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials' }))
    .body.json() as { access_token: string }).access_token

    let response: SpotifyResponse
    try {
        response = await (await request(`https://api.spotify.com/v1/playlists/${playlistId}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })).body.json() as SpotifyResponse
    } catch {
        return { embeds: [ generateEmbed('error', { title: 'Playlist not found! (Make sure it is a public playlist)' }) ] }
    }

    void info.interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Locating Songs...' }) ] })

    const items: QueueItem[] = []

    for (const song of response.tracks.items) {
        const filter = (await ytsr.getFilters(`${song.track.name} ${song.track.artists[0].name}`)).get('Type').get('Video')
        const term = await ytsr(filter.url, { limit: 1 })
        if (term.results < 1) {
            void info.interaction.channel.send({ embeds: [ generateEmbed('error', { title: `No results found for "${song.track.name}"` }) ] })
            continue
        }
        const ytvideo = term.items[0] as ytsr.Video
        items.push({ url: ytvideo.url, title: ytvideo.title, duration: ytvideo.duration, thumbnail: ytvideo.bestThumbnail.url })
    }

    await info.queueManager.addToQueue(items, info.interaction.options.getInteger('position') - 1)
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

async function play(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    const member = await info.interaction.guild.members.fetch(info.interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type !== 'GUILD_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    const url = info.interaction.options.getString('name').trim()

    void info.interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Boiling potatoes...' }) ] })

    if (/^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(url)) {
        return spotify(info, voiceChannel)
    }

    if (/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([A-Za-z\d-_&=?]+)$/.test(url)) {
        const results = await ytpl(url).catch((): false => {
            void info.interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] })
            return false
        })
        if (!results) return
        const items: QueueItem[] = []
        for (const item of results.items) {
            items.push({ url: item.shortUrl, title: item.title, duration: item.duration, thumbnail: item.bestThumbnail.url })
        }
        await info.queueManager.addToQueue(items, info.interaction.options.getInteger('position') - 1)
        await info.queueManager.connect(voiceChannel)
        return { embeds: [ generateEmbed('success', { title: `Added playlist "${results.title}" to queue!`, fields: [ { name: 'URL:', value: url } ], image: { url: results.bestThumbnail.url } }) ] }
    }

    if (/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(url)) {
        const result = await resolve(url) as { readonly webpage_url: string, readonly title: string, readonly thumbnail: string, readonly duration: number, readonly success: boolean }
        if (!result.success) {
            return { embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] }
        }
        const hour = Math.floor(result.duration / 3600)
        const min = Math.floor((result.duration % 3600) / 60)
        const sec = (result.duration % 60)
        await info.queueManager.addToQueue([ { url: result.webpage_url, title: result.title, duration: `${hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : ''}${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`, thumbnail: result.thumbnail } ], info.interaction.options.getInteger('position') - 1)
        await info.queueManager.connect(voiceChannel)
        return { embeds: [ generateEmbed('success', { title: `Added "${result.title}" to queue!`, fields: [ { name: 'URL:', value: result.webpage_url } ], image: { url: result.thumbnail } }) ] }
    }

    const filter = (await ytsr.getFilters(url)).get('Type').get('Video')
    const term = await ytsr(filter.url, {
        limit: 1,
    })
    if (term.results < 1) {
        return { embeds: [ generateEmbed('error', { title: `No results found for "${url}"` }) ] }
    }
    const result = term.items[0] as ytsr.Video
    await info.queueManager.addToQueue([ { url: result.url, title: result.title, duration: result.duration, thumbnail: result.bestThumbnail.url } ], info.interaction.options.getInteger('position') - 1)
    await info.queueManager.connect(voiceChannel)
    return { embeds: [ generateEmbed('success', { title: `Added "${result.title}" to queue!`, fields: [ { name: 'URL:', value: result.url } ], image: { url: result.bestThumbnail.url } }) ] }
}

async function search(info: GuildAutocompleteInfo): Promise<ApplicationCommandOptionChoice[]> {
    if ((info.option.value as string).length < 3 || /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(info.option.value as string) || /^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(info.option.value as string)) {
        return
    }
    const filter = (await ytsr.getFilters(info.option.value as string)).get('Type').get('Video')
    const results = await ytsr(filter.url, { limit: 4 })
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of results.items as ytsr.Video[]) {
        options.push({ name: result.title, value: result.url })
    }
    return options
}

export const command = new GuildChatCommand({
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
}, { respond: play, autocomplete: search, ephemeral: true })
