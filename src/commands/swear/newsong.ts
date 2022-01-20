import { CommandInteraction } from 'discord.js'
import { BotInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { exec } from 'node:child_process'
import { request } from 'undici'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'

async function newSong(interaction: CommandInteraction, info: BotInfo): Promise<void> {
    if (interaction.user.id !== process.env.ADMIN && interaction.user.id !== process.env.SWEAR) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] })
        return
    }
    let check: number
    try {
        check = (await request(interaction.options.getString('url'))).statusCode
    } catch {
        check = 0
    }
    if (check !== 200) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] })
        return
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const songs = <{ index: number, name: string }[]> <unknown> await info.database.select('swear_songs')
    exec(`"./assets/binaries/yt-dlp" "${interaction.options.getString('url')}" --output "${process.env.DATA}/music_files/swear_songs/song${songs.length + 1}.%(ext)s" --quiet --format "bestaudio[ext=webm][acodec=opus]/bestaudio" --limit-rate "1M"`, async (error) => {
        if (error) {
            void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] })
            return
        }
        await info.database.insert('swear_songs', { index: songs.length + 1, name: `song${songs.length + 1}` })
        void interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Success!' }) ] })
    })
}

export const command = new ChatCommand({
    name: 'newsong',
    description: 'Add a new song to Swear Bot\'s library',
    options: [
        {
            name: 'url',
            type: 'STRING',
            description: 'The URL for the new swear song',
            required: true,
        },
    ],
}, { respond: newSong })