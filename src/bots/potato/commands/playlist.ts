import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import { existsSync, readFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { config } from '../../../core/constants'
import { GuildInputManager } from '../../../core/GuildInputManager'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

const data: ApplicationCommandData = {
    name: 'playlist',
    description: 'Play a song from the list of featured playlists',
    options: [ {
        name: 'name',
        description: 'The name of the playlist',
        type: 'STRING',
        required: true,
        choices: [
            {
                name: 'epic',
                value: 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2'
            },
            {
                name: 'magic',
                value: 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl'
            },
            {
                name: 'undertale',
                value: 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x'
            },
            {
                name: 'fun',
                value: 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD'
            }
        ]
    } ]
}

async function playlist(interaction: CommandInteraction, info: GuildInputManager): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    const output = await youtubedl(interaction.options.getString('name'), {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        ignoreErrors: true,
        geoBypass: true,
        flatPlaylist: true
    })
    for (const entry of output.entries) {
        let songData
        if (existsSync(`${config.data}/music_files/playback/${entry.id}.json`)) {
            songData = JSON.parse(readFileSync(`${config.data}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }))
        } else {
            songData = entry
        }
        info.getPotatoVoiceManager().addToQueue(songData.duration, `https://www.youtube.com/watch?v=${songData.id}`, songData.title, songData.id, songData?.thumbnail)
    }
    info.getPotatoVoiceManager().bindChannel(<TextChannel> interaction.channel)
    if (!info.getPotatoVoiceManager().connect(voiceChannel)) {
        return { content: 'Something went wrong when connecting to voice' }
    }
    return { content: 'Added to queue!' }
}

module.exports = new BaseCommand(data, playlist)