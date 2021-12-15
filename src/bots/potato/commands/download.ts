import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command } from '../../../core/utils/interfaces.js'
import { ytdl } from '../../../core/utils/ytdl.js'

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
    if (interaction.options.getBoolean('dev')) {
        await ytdl(interaction.options.getString('url'), {
            output: `${process.env.data}/new_downloads/%(title)s.%(ext)s`,
            quiet: true,
            format: 'bestaudio[ext=webm][acodec=opus]/bestaudio',
            limitRate: '100K'
        })
        return { embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] }
    }
    await ytdl(interaction.options.getString('url'), {
        output: `${process.env.data}/new_downloads/%(title)s.%(ext)s`,
        quiet: true,
        format: 'bestaudio',
        limitRate: '100K'
    })
    return { embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] }
}

export const command: Command = { data: data, execute: download }