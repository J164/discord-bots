import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'
import { download } from '../../core/modules/ytdl.js'

async function downloadVideo(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    if (interaction.user.id !== process.env.ADMIN) {
        return { embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] }
    }
    if (!/^(?:https:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z\d-_&=]+)$/.test(interaction.options.getString('url'))) {
        return { embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] }
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    await download({ url: interaction.options.getString('url'), quiet: true, outtmpl: `${process.env.DATA}/new_downloads/%(title)s.%(ext)s`, format: interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best' }) ? void interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] }) : void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Download Failed!' }) ] })
}

export const command = new ChatCommand({
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