import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { GuildInfo, SwearSongInfo } from '../../../core/utils/interfaces'
import ytdl from 'ytdl-core'
import { createWriteStream, writeFileSync } from 'fs'
import { generateEmbed } from '../../../core/utils/commonFunctions'

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

async function newSong(interaction: CommandInteraction, info: GuildInfo): Promise<void> {
    if (interaction.member.user.id !== process.env.admin && interaction.member.user.id !== process.env.swear) {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] })
        return
    }
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Getting information on new song...' }) ] })
    let output: ytdl.videoInfo
    try {
        output = await ytdl.getInfo(interaction.options.getString('url'))
    } catch (err) {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'It seems like something went wrong. Make sure to enter the url of a single public YouTube video.' }) ] })
        return
    }
    if (new Number(output.videoDetails.lengthSeconds).valueOf() > 1200) {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'The video length limit is 20 minutes! Aborting...' }) ] })
        return
    }
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const songs = <SwearSongInfo[]> <unknown> await info.database.select('swear_songs')
    writeFileSync(`${process.env.data}/music_files/swear_songs/song${songs.length + 1}.webm`, '')
    ytdl.downloadFromInfo(output, {
        filter: format => format.container === 'webm' && format.audioSampleRate === '48000' && format.codecs === 'opus'
    }).pipe(createWriteStream(`${process.env.data}/music_files/swear_songs/song${songs.length + 1}.webm`))
    await info.database.insert('swear_songs', { index: `${songs.length + 1}`, name: `song${songs.length + 1}` })
    interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Success!' }) ] })
}

module.exports = { data: data, execute: newSong }