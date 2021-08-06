import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { home } from '../../../core/constants'
import { SwearSongInfo } from '../../../core/interfaces'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

const data: ApplicationCommandData = {
    name: 'newsong',
    description: 'Add a new song to Swear Bot\'s library',
    options: [
        {
            name: 'url',
            type: 'STRING',
            description: 'The URL for the new swear song',
            required: true
        },
        {
            name: 'name',
            type: 'STRING',
            description: 'The name of the new song (must be unique)',
            required: true
        }
    ]
}

async function newSong(interaction: CommandInteraction, info: PotatoGuildInputManager, songs: SwearSongInfo[]): Promise<void> {
    if (interaction.member !== info.users.get('admin') && interaction.member !== info.users.get('swear')) {
        interaction.editReply({ content: 'You don\'t have permission to use this command!' })
        return
    }
    for (const song of songs) {
        if (song.name === interaction.options.getString('name')) {
            interaction.editReply({ content: 'Please enter a unique name' })
            return
        }
    }
    interaction.editReply({ content: 'Getting information on new song...' })
    const output = await youtubedl(interaction.options.getString('url'), {
        dumpJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        ignoreErrors: true
    })
    if (!output) {
        interaction.editReply({ content: 'It appears the video was unavailable' })
        return
    }
    if ('entries' in output) {
        interaction.editReply({ content: 'Please only enter a single video at a time' })
        return
    }
    if (output.duration > 1200) {
        interaction.editReply({ content: 'The video length limit is 20 minutes! Aborting...' })
        return
    }
    interaction.editReply({ content: 'Downloading...' })
    youtubedl(interaction.options.getString('url'), {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/music_files/swear_songs/${interaction.options.getString('name')}.mp3`
    })
    const song = new Map<string, string>([
        [ 'name', interaction.options.getString('name') ]
    ])
    info.database.insert('swear_songs', song)
    interaction.editReply({ content: 'Success!' })
}

function getSongs(interaction: CommandInteraction, info: PotatoGuildInputManager): void {
    info.database.select('swear_songs', results => {
        newSong(interaction, info, <SwearSongInfo[]> results)
    })
}

module.exports = new BaseCommand(data, getSongs)