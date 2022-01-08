import { CommandInteraction } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { exec } from 'node:child_process'
import ytsr from 'ytsr'

async function newSong(interaction: CommandInteraction, info: GuildInfo): Promise<void> {
    if (interaction.member.user.id !== process.env.ADMIN && interaction.member.user.id !== process.env.SWEAR) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] })
        return
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Getting information on new song...' }) ] })
    const filter = (await ytsr.getFilters(interaction.options.getString('url'))).get('Type').get('Video')
    const result = <ytsr.Video> (await ytsr(filter.url, { limit: 1 })).items[0]
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const songs = <{ index: number, name: string }[]> <unknown> await info.database.select('swear_songs')
    exec(`"./assets/binaries/yt-dlp" "${result.url}" --output "${process.env.DATA}/music_files/swear_songs/song${songs.length + 1}.%(ext)s" --quiet --format "bestaudio[ext=webm][acodec=opus]/bestaudio" --limit-rate "1M"`, async () => {
        await info.database.insert('swear_songs', { index: songs.length + 1, name: `song${songs.length + 1}` })
        void interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Success!' }) ] })
    })
}

export const command: Command = { data: {
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
}, execute: newSong }