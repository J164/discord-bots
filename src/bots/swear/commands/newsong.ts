import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'
import { generateEmbed } from '../../../core/utils/generators.js'
import { ytdl, YtResponse } from '../../../core/utils/ytdl.js'

const data: ApplicationCommandData = {
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
}

async function newSong(interaction: CommandInteraction, info: GuildInfo): Promise<void> {
    if (interaction.member.user.id !== process.env.admin && interaction.member.user.id !== process.env.swear) {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] })
        return
    }
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Getting information on new song...' }) ] })
    let output: YtResponse
    try {
        output = await ytdl(interaction.options.getString('url'), { print: '{"duration":%(duration)s}' })
    } catch (err) {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'It seems like something went wrong. Make sure to enter the url of a single public YouTube video.' }) ] })
        return
    }
    if (output.duration > 1200) {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'The video length limit is 20 minutes! Aborting...' }) ] })
        return
    }
    interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const songs = <{ index: number, name: string }[]> <unknown> await info.database.select('swear_songs')
    await ytdl(output.webpage_url, {
        output: `${process.env.data}/music_files/swear_songs/song${songs.length + 1}.%(ext)s`,
        quiet: true,
        format: 'bestaudio[ext=webm][acodec=opus]/bestaudio',
        limitRate: '100K'
    })
    await info.database.insert('swear_songs', { index: songs.length + 1, name: `song${songs.length + 1}` })
    interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Success!' }) ] })
}

export const command: Command = { data: data, execute: newSong }