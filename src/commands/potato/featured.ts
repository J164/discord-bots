import { exec, ExecException } from 'node:child_process'
import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import { QueueItem } from '../../core/voice/queue-manager.js'

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
    const output = await new Promise((resolve: (value: string) => void, reject: (error: ExecException) => void) => {
        exec(`"./assets/binaries/yt-dlp" ${interaction.options.getString('name')} --flat-playlist --print {\\"webpage_url\\":\\"%(webpage_url)s\\",\\"title\\":\\"%(title)s\\",\\"duration\\":%(duration)s}`, (error, stdout) => {
            if (error) {
                reject(error)
                return
            }
            resolve(stdout)
        })
    })
    const parsedOutput: { readonly webpage_url: string, readonly title: string, readonly duration: number }[] = []
    for (const song of output.split('\n')) {
        try {
            parsedOutput.push(JSON.parse(song))
        } catch {
            break
        }
    }
    const items: QueueItem[] = []
    for (const song of parsedOutput) {
        items.push({ url: song.webpage_url, title: song.title, duration: song.duration })
    }
    await info.queueManager.addToQueue(items, interaction.options.getNumber('position') - 1)
    if (!info.queueManager.connect(voiceChannel)) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong when connecting to voice' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: 'Added to queue!' }) ] }
}

export const command: Command = { data: data, execute: featured }