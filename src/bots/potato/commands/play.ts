import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import { existsSync, readFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { searchYoutube } from '../../../core/commonFunctions'
import { config } from '../../../core/constants'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

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

async function play(interaction: CommandInteraction, info: PotatoGuildInputManager): Promise<InteractionReplyOptions> {
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
    let output
    if (url.split(/[?&]+/)[1].startsWith('list') || !existsSync(`${config.data}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`)) {
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
            return { content: 'Please enter a valid url' }
        }
    } else {
        output = JSON.parse(readFileSync(`${config.data}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`, { encoding: 'utf8' }))
    }
    if ('entries' in output) {
        for (const entry of output.entries) {
            let songData
            if (existsSync(`${config.data}/music_files/playback/${entry.id}.json`)) {
                songData = JSON.parse(readFileSync(`${config.data}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }))
            } else {
                songData = entry
            }
            info.voiceManager.addToQueue(songData.duration, `https://www.youtube.com/watch?v=${songData.id}`, songData.title, songData.id, songData?.thumbnail)
        }
    } else {
        info.voiceManager.addToQueue(output.duration, output.webpage_url, output.title, output.id, output?.thumbnail)
    }
    info.voiceManager.bindChannel(<TextChannel> interaction.channel)
    if (!info.voiceManager.connect(voiceChannel)) {
        return { content: 'Something went wrong when connecting to voice' }
    }
    return { content: 'Added to queue!' }
}

module.exports = new BaseCommand(data, play)