import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import { QueueItem } from '../../core/voice/queue-manager.js'
import ytpl from 'ytpl'

async function featured(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { embeds: [ generateEmbed('error', { title: 'This command can only be used while in a visable voice channel!' }) ] }
    }
    const results = await ytpl(interaction.options.getString('name')).catch((): false => {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Please enter a valid url (private playlists will not work)' }) ] })
        return false
    })
    if (!results) return
    const items: QueueItem[] = []
    for (const item of results.items) {
        items.push({ url: item.url, title: item.title, duration: item.duration, thumbnail: item.bestThumbnail.url })
    }
    await info.queueManager.addToQueue(items, interaction.options.getInteger('position') - 1)
    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: `Added playlist "${results.title}" to queue!`, image: { url: results.bestThumbnail.url } }) ] }
}

export const command: Command = { data: {
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
}, execute: featured }