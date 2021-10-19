import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { config } from '../../../core/utils/constants'
import { GuildInputManager } from '../../../core/GuildInputManager'
import youtubedl from 'youtube-dl-exec'

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
            name: 'audioonly',
            description: 'If you want only audio to download',
            type: 'BOOLEAN',
            required: false
        }
    ]
}

async function download(interaction: CommandInteraction, info: GuildInputManager): Promise<InteractionReplyOptions> {
    if (interaction.member !== info.users.get('admin')) {
        return { content: 'You don\'t have permission to use this command!' }
    }
    const options = {
        quiet: true,
        noCallHome: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        limitRate: '5M',
        output: `${config.data}/New Downloads/%(title)s.%(ext)s`
    }
    if (interaction.options.getBoolean('audioonly')) {
        options.format = 'bestvideo,bestaudio'
    }
    interaction.editReply({ content: 'Downloading...' })
    await youtubedl(interaction.options.getString('url'), options)
    return { content: 'Download Successful!' }
}

module.exports = new BaseCommand(data, download)