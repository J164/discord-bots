import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import ytdl from 'ytdl-core'
import { createWriteStream, writeFileSync } from 'fs'
import { generateEmbed } from '../../../core/utils/generators'

const data: ApplicationCommandData = {
    name: 'download',
    description: 'Download a video off of Youtube',
    options: [
        {
            name: 'url',
            description: 'The url of the video you want to download',
            type: 'STRING',
            required: true
        },
        {
            name: 'dev',
            description: 'Download the opus encoded webm file for this song',
            type: 'BOOLEAN',
            required: false
        }
    ]
}

async function download(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    if (interaction.member.user.id !== process.env.admin) {
        return { embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] }
    }
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const video = await ytdl.getInfo(interaction.options.getString('url'))
    if (interaction.options.getBoolean('dev')) {
        writeFileSync(`${process.env.data}/New Downloads/${video.videoDetails.title}.webm`, '')
        ytdl(interaction.options.getString('url'), {
            filter: filter => filter.container === 'webm' && filter.audioSampleRate === '48000' && filter.codecs === 'opus'
        }).pipe(createWriteStream(`${process.env.data}/New Downloads/${video.videoDetails.title}.webm`))
        return { embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] }
    }
    writeFileSync(`${process.env.data}/New Downloads/${video.videoDetails.title}.mp4`, '')
    ytdl(interaction.options.getString('url'), {
        filter: filter => filter.container === 'mp4'
    }).pipe(createWriteStream(`${process.env.data}/New Downloads/${video.videoDetails.title}.mp4`))
    return { embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] }
}

module.exports = { data: data, execute: download }