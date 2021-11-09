import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { GuildInfo, SwearSongInfo } from '../../../core/utils/interfaces'
import ytdl from 'ytdl-core'
import { createWriteStream, writeFileSync } from 'fs'

const data: ApplicationCommandData = {
    name: 'newsong',
    description: 'Add a new song to Swear Bot\'s library',
    options: [
        {
            name: 'url',
            type: 'STRING',
            description: 'The URL for the new swear song',
            required: true
        }
    ]
}

async function newSong(interaction: CommandInteraction, info: GuildInfo, songs: SwearSongInfo[]): Promise<void> {
    if (interaction.member.user.id !== process.env.admin && interaction.member.user.id !== process.env.swear) {
        interaction.editReply({ content: 'You don\'t have permission to use this command!' })
        return
    }
    interaction.editReply({ content: 'Getting information on new song...' })
    let output: ytdl.videoInfo
    try {
        output = await ytdl.getInfo(interaction.options.getString('url'))
    } catch (err) {
        interaction.editReply({ content: 'It seems like something went wrong. Make sure to enter the url of a single public YouTube video.' })
        return
    }
    if (new Number(output.videoDetails.lengthSeconds).valueOf() > 1200) {
        interaction.editReply({ content: 'The video length limit is 20 minutes! Aborting...' })
        return
    }
    interaction.editReply({ content: 'Downloading...' })
    writeFileSync(`${process.env.data}/music_files/swear_songs/song${songs.length + 1}.webm`, '')
    ytdl.downloadFromInfo(output, {
        filter: format => format.container === 'webm' && format.audioSampleRate === '48000' && format.codecs === 'opus'
    }).pipe(createWriteStream(`${process.env.data}/music_files/swear_songs/song${songs.length + 1}.webm`))
    const song = new Map<string, string>([
        [ 'name', `song${songs.length + 1}` ]
    ])
    info.database.insert('swear_songs', song)
    interaction.editReply({ content: 'Success!' })
}

function getSongs(interaction: CommandInteraction, info: GuildInfo): void {
    info.database.select('swear_songs', results => {
        newSong(interaction, info, <SwearSongInfo[]> results)
    })
}

module.exports = { data: data, execute: getSongs }