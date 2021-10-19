import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import { existsSync, readFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { config } from '../../../core/utils/constants'
import { GuildInputManager } from '../../../core/GuildInputManager'
import youtubedl from 'youtube-dl-exec'
import { YTResponse } from '../../../core/utils/interfaces'

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
    const output: YTResponse = await youtubedl(interaction.options.getString('name'), {
        dumpSingleJson: true,
        quiet: true,
        noCallHome: true,
        flatPlaylist: true
    })
    for (const entry of output.entries) {
        let songData
        if (existsSync(`${config.data}/music_files/playback/${entry.id}.json`)) {
            songData = JSON.parse(readFileSync(`${config.data}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }))
        } else {
            songData = entry
        }
        info.queueManager.addToQueue(songData.duration, `https://www.youtube.com/watch?v=${songData.id}`, songData.title, songData.id, songData.thumbnail)
    }
    info.queueManager.bindChannel(<TextChannel> interaction.channel)
    if (!info.queueManager.connect(voiceChannel)) {
        return { content: 'Something went wrong when connecting to voice' }
    }
    return { content: 'Added to queue!' }
}

module.exports = new BaseCommand(data, playlist)