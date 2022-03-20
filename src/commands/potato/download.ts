import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { download } from '../../core/modules/ytdl.js'
import { GlobalChatCommand, GlobalChatCommandInfo } from '../../core/utils/interfaces.js'

function downloadVideo(info: GlobalChatCommandInfo): InteractionReplyOptions {
    if (info.interaction.user.id !== process.env.ADMIN) {
        return { embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] }
    }
    if (!/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(info.interaction.options.getString('url'))) {
        return { embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] }
    }
    void info.interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    download(info.interaction.options.getString('url'), { outtmpl: `${process.env.DATA}/new_downloads/%(title)s.%(ext)s`, format: info.interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best' })
       .then(
            () => {
                void info.interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] }).catch()
            },
            (error) => {
		console.log(error)
                void info.interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Download Failed!' }) ] }).catch()
            },
        )
}

export const command = new GlobalChatCommand({
    name: 'download',
    description: 'Download a video off of Youtube',
    options: [
        {
            name: 'url',
            description: 'The url of the video you want to download',
            type: 'STRING',
            required: true,
        },
        {
            name: 'dev',
            description: 'Download the opus encoded webm file for this song',
            type: 'BOOLEAN',
            required: false,
        },
    ],
}, { respond: downloadVideo })
