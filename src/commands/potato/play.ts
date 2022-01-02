import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import ytsr from 'ytsr'
import { generateEmbed } from '../../core/utils/generators.js'
import { exec, ExecException } from 'node:child_process'

//fixme spotify

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Play a song',
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
    const argument = interaction.options.getString('name')

    if (/^(https:\/\/)?open\.spotify\.com\//.test(argument)) {
        return { embeds: [ generateEmbed('error', { title: 'Spotify functionality is currently under construction' }) ] }
    }

    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Boiling potatoes...' }) ] })

    let url: string

    if (!/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(argument) /*&& !/^(https:\/\/)?open\.spotify\.com\//.test(argument)*/) {
        const term = await ytsr(argument, {
            limit: 5
        })
        if (term.results < 1) {
            return { embeds: [ generateEmbed('error', { title: `No results found for "${argument}"` }) ] }
        }
        url = (<ytsr.Video> term.items.find(result => result.type === 'video')).url
    }

    url ??= argument

    if (/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/playlist/.test(argument) /*|| !/^(https:\/\/)?open\.spotify\.com\/playlist\//.test(argument)*/) {
        try {
            const output = await new Promise((resolve: (value: string) => void, reject: (error: ExecException) => void) => {
                exec(`"./assets/binaries/yt-dlp" ${url} --flat-playlist --print {\\"webpage_url\\":\\"%(webpage_url)s\\",\\"title\\":\\"%(title)s\\",\\"duration\\":%(duration)s}`, (error, stdout) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve(stdout)
                })
            })
            const parsedOutput: { readonly webpage_url: string, readonly title: string, readonly duration: number }[] = []
            for (const song of output.split('\n')) {
                try {
                    parsedOutput.push(JSON.parse(song))
                } catch {
                    break
                }
            }
            const items = []
            for (const song of parsedOutput) {
                items.push({ url: song.webpage_url, title: song.title, duration: song.duration })
            }
            await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
        } catch (error) {
            console.warn(error)
            return { embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] }
        }
    } else {
        try {
            const output: { readonly webpage_url: string, readonly title: string, readonly thumbnail: string, readonly duration: number } = JSON.parse(await new Promise((resolve: (value: string) => void, reject: (error: ExecException) => void) => {
                exec(`"./assets/binaries/yt-dlp" ${url} --print {\\"webpage_url\\":\\"%(webpage_url)s\\",\\"title\\":\\"%(title)s\\",\\"thumbnail\\":\\"%(thumbnail)s\\",\\"duration\\":%(duration)s}`, (error, stdout) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve(stdout)
                })
            }))
            await info.queueManager.addToQueue([ { url: output.webpage_url, title: output.title, thumbnail: output.thumbnail, duration: output.duration } ], interaction.options.getInteger('position') - 1)
        } catch (error) {
            console.warn(error)
            return { embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] }
        }
    }

    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: 'Added to queue!' }) ] }
}

async function search(option: ApplicationCommandOptionChoice): Promise<ApplicationCommandOptionChoice[]> {
    if ((<string> option.value).length < 3 || (/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//).test(<string> option.value) || (/^(https:\/\/)?open\.spotify\.com\/playlist\//).test(<string> option.value)) {
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

export const command: Command = { data: data, execute: play, autocomplete: search }
