import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import ytdl from 'ytdl-core'
import ytpl from 'ytpl'
import { GuildInfo } from '../../../core/utils/interfaces'
import { QueueItem } from '../../../core/voice/QueueItem'
import ytsr from 'ytsr'
import { generateEmbed } from '../../../core/utils/commonFunctions'

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

async function play(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    const arg = interaction.options.getString('name')
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Boiling potatoes...' }) ] })

    let url: string
    if (!arg.match(/(\.|^|\W)(youtube\.com|youtu\.be)\//)) {
        const term = await ytsr(arg, {
            limit: 5
        })
        if (term.results < 1) {
            return { embeds: [ generateEmbed('error', { title: `No results found for "${arg}"` }) ] }
        }
        url = (<ytsr.Video> term.items.filter(result => result.type === 'video')[0]).url
    } else {
        url = arg
    }

    if (url.indexOf('list=') !== -1) {
        try {
            const playlist = await ytpl(`https://youtube.com/playlist?list=${url.substr(url.indexOf('list=') + 5)}`)
            const items = []
            for (const song of playlist.items) {
                items.push(new QueueItem(song.url, song.title, song.bestThumbnail.url, song.durationSec))
            }
            await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
        } catch (err) {
            console.warn(err)
            return { embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] }
        }
    } else {
        try {
            const output = await ytdl.getInfo(url)
            await info.queueManager.addToQueue([ new QueueItem(output.videoDetails.video_url, output.videoDetails.title, output.videoDetails.thumbnails[0].url, new Number(output.videoDetails.lengthSeconds).valueOf()) ], interaction.options.getInteger('position') - 1)
        } catch (err) {
            console.warn(err)
            return { embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] }
        }
    }

    info.queueManager.bindChannel(<TextChannel> interaction.channel)
    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: 'Added to queue!' }) ] }
}

async function search(option: ApplicationCommandOptionChoice): Promise<ApplicationCommandOptionChoice[]> {
    if ((<string> option.value).length < 3 || (<string> option.value).match(/(\.|^|\W)(youtube\.com|youtu\.be)\//)) {
        return null
    }
    const results = await ytsr(<string> option.value, {
        limit: 5
    })
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