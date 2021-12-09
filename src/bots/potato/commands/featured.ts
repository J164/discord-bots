import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import ytpl from 'ytpl'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'
import { QueueItem } from '../../../core/voice/QueueManager'

const data: ApplicationCommandData = {
    name: 'featured',
    description: 'Play a song from the list of featured playlists',
    options: [
        {
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
        },
        {
            name: 'position',
            description: 'Where in the queue to put the song (defaults to the end)',
            type: 'INTEGER',
            required: false
        }
    ]
}

async function featured(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { embeds: [ generateEmbed('error', { title: 'This command can only be used while in a visable voice channel!' }) ] }
    }
    const output = await ytpl(interaction.options.getString('name'))
    const items: QueueItem[] = []
    for (const song of output.items) {
        items.push({ url: song.url, title: song.title, thumbnail: song.bestThumbnail.url, duration: song.durationSec })
    }
    await info.queueManager.addToQueue(items, interaction.options.getNumber('position') - 1)
    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: 'Added to queue!' }) ] }
}

module.exports = { data: data, execute: featured }