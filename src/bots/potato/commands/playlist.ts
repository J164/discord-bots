import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'
import ytpl from 'ytpl'

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
    const output = await ytpl(interaction.options.getString('name'))
    for (const song of output.items) {
        info.queueManager.addToQueue(song.durationSec, song.url, song.title, song.id, song.bestThumbnail.url)
    }
    info.queueManager.bindChannel(<TextChannel> interaction.channel)
    if (!info.queueManager.connect(voiceChannel)) {
        return { content: 'Something went wrong when connecting to voice' }
    }
    return { content: 'Added to queue!' }
}

module.exports = new BaseCommand(data, playlist)