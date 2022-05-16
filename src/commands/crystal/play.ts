import { AudioPlayerStatus } from '@discordjs/voice'
import { ApplicationCommandOptionChoice, InteractionReplyOptions } from 'discord.js'
import { createReadStream, readFileSync } from 'node:fs'
import Fuse from 'fuse.js'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { GuildAutocompleteInfo, GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function play(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    const member = await info.interaction.guild.members.fetch(info.interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type !== 'GUILD_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }

    const songs = (JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf8' })) as { songs: string[] }).songs

    let song: number

    if (!songs.includes(info.interaction.options.getString('name'))) {
        const results = new Fuse(songs).search(info.interaction.options.getString('name'))
        song = results[0].refIndex + 1
    }

    song ??= songs.indexOf(info.interaction.options.getString('name')) + 1

    await info.voiceManager.connect(voiceChannel)
    await info.voiceManager.playStream(createReadStream(`${process.env.DATA}/music_files/naruto_ost/${song}.webm`))
    if (info.interaction.options.getBoolean('loop')) {
        info.voiceManager.player.on('stateChange', (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle) {
                return
            }
            void info.voiceManager.playStream(createReadStream(`${process.env.DATA}/music_files/naruto_ost/${song}.webm`))
        })
    }
    void info.interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Now Playing!' }) ] })
}

function search(info: GuildAutocompleteInfo): ApplicationCommandOptionChoice[] {
    if ((info.option.value as string).length < 3) {
        return
    }
    const results = new Fuse((JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf8' })) as { songs: string[] }).songs).search(info.option.value as string)
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of results) {
        if (options.length > 3) {
            break
        }
        options.push({ name: result.item, value: result.item })
    }
    return options
}

export const command = new GuildChatCommand({
    name: 'play',
    description: 'Play a song from the Naruto OST',
    options: [
        {
            name: 'name',
            description: 'The name of the song (defaults to a random song)',
            type: 'STRING',
            autocomplete: true,
            required: true,
        },
        {
            name: 'loop',
            description: 'Whether to loop the song',
            type: 'BOOLEAN',
            required: false,
        },
    ],
}, { respond: play, autocomplete: search })