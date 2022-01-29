import { CommandInteraction } from 'discord.js'
import { BotInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'
import { download } from '../../core/modules/ytdl.js'

async function newSong(interaction: CommandInteraction, info: BotInfo): Promise<void> {
    if (interaction.user.id !== process.env.ADMIN && interaction.user.id !== process.env.SWEAR) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] })
        return
    }
    if (!/^(?:https:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z\d-_&=]+)$/.test(interaction.options.get('url').value as string)) {
        void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Not a valid url!' }) ] })
        return
    }
    void interaction.editReply({ embeds: [ generateEmbed('info', { title: 'Downloading...' }) ] })
    const songs = await info.database.select('swear_songs') as unknown as { index: number, name: string }[]
    if (await download({ url: interaction.options.getString('url'), quiet: true, outtmpl: `${process.env.DATA}/music_files/swear_songs/song${songs.length + 1}.%(ext)s`, format: 'bestaudio[ext=webm][acodec=opus]/bestaudio' })) {
        await info.database.insert('swear_songs', { index: songs.length + 1, name: `song${songs.length + 1}` })
        void interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Success!' }) ] })
        return
    }
    void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Download Failed!' }) ] })
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