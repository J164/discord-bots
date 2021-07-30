import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { home, refreshData, userData } from '../../../core/common'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

let feature: any

//add custom name feature

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

async function newSong(interaction: CommandInteraction, info: PotatoGuildInputManager): Promise<InteractionReplyOptions> {
    if (interaction.member !== info.users.get('admin') && interaction.member !== info.users.get('swear')) {
        return { content: 'You don\'t have permission to use this command!' }
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
        return { content: 'It appears the video was unavailable' }
    }
    if ('entries' in output) {
        return { content: 'Please only enter a single video at a time' }
    }
    if (output.duration > 1200) {
        return { content: 'The video length limit is 20 minutes! Aborting...' }
    }
    interaction.editReply({ content: 'Downloading...' })
    youtubedl(interaction.options.getString('url'), {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/music_files/swear_songs/song${userData.swearSongs.length + 1}.mp3`
    })
    refreshData()
    userData.swearSongs.push(`song${userData.swearSongs.length + 1}.mp3`)
    const jsonString = JSON.stringify(userData)
    writeFileSync(`${home}/sys_files/bots.json`, jsonString)
    return { content: 'Success!' }
}

module.exports = new BaseCommand(data, newSong)