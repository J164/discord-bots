import { CommandInteraction } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { exec } from 'node:child_process'

async function newSong(interaction: CommandInteraction, info: GuildInfo): Promise<void> {
    if (interaction.member.user.id !== process.env.ADMIN && interaction.member.user.id !== process.env.SWEAR) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] })
        return
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Getting information on new song...' }) ] })
    let output: { readonly duration: number, readonly webpage_url: string }
    try {
        output = JSON.parse(await new Promise((resolve: (value: string) => void, reject: () => void) => {
            exec(`"./assets/binaries/yt-dlp" "${interaction.options.getString('url')}" --print "{\\"duration\\":%(duration)s,\\"webpage_url\\":\\"%(webpage_url)s}\\"}"`, (error, stdout) => {
                if (error) {
                    reject()
                    return
                }
                resolve(stdout)
            })
        }))
    } catch {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'It seems like something went wrong. Make sure to enter the url of a single public YouTube video.' }) ] })
        return
    }
    if (output.duration > 1200) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'The video length limit is 20 minutes! Aborting...' }) ] })
        return
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const songs = <{ index: number, name: string }[]> <unknown> await info.database.select('swear_songs')
    exec(`"./assets/binaries/yt-dlp" "${output.webpage_url}" --output "${process.env.DATA}/music_files/swear_songs/song${songs.length + 1}.%(ext)s" --quiet --format "bestaudio[ext=webm][acodec=opus]/bestaudio" --limit-rate "1M"`, async () => {
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