import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { exec } from 'node:child_process'
import { request } from 'undici'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'

async function download(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    if (interaction.user.id !== process.env.ADMIN) {
        return { embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] }
    }
    let check: number
    try {
        check = (await request(interaction.options.getString('url'))).statusCode
    } catch {
        check = 0
    }
    if (check !== 200) {
        return { embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] }
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    exec(`"./assets/binaries/yt-dlp" "${interaction.options.getString('url')}" --output "${process.env.DATA}/new_downloads/%(title)s.%(ext)s" --quiet --format "${ interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best'}" --limit-rate "1M"`,
        error => {
            if (error) {
                void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Download Failed!' }) ] })
                return
            }
            void interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Download Successful!' }) ] })
        })
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
}, { respond: download })