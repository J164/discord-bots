import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { config } from '../../../core/utils/constants'
import ytdl from 'ytdl-core'
import { createWriteStream, writeFileSync } from 'fs'

const data: ApplicationCommandData = {
    name: 'download',
    description: 'Download a video off of Youtube',
    options: [
        {
            name: 'url',
            description: 'The url of the video you want to download',
            type: 'STRING',
            required: true
        }
    ]
}

async function download(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    if (interaction.member.user.id !== config.admin) {
        return { content: 'You don\'t have permission to use this command!' }
    }
    interaction.editReply({ content: 'Downloading...' })
    const video = await ytdl.getInfo(interaction.options.getString('url'))
    writeFileSync(`${config.data}/New Downloads/${video.videoDetails.title}.mp4`, '')
    ytdl(interaction.options.getString('url'), {
        filter: filter => filter.container === 'mp4'
    }).pipe(createWriteStream(`${config.data}/New Downloads/test.mp4`))
    return { content: 'Download Successful!' }
}

module.exports = new BaseCommand(data, download)