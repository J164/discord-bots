import { AudioPlayerStatus } from '@discordjs/voice'
import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { createReadStream, readFileSync } from 'fs'
import Fuse from 'fuse.js'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Play a song from the Naruto OST',
    options: [
        {
            name: 'name',
            description: 'The name of the song (defaults to a random song)',
            type: 'STRING',
            autocomplete: true,
            required: false
        },
        {
            name: 'loop',
            description: 'Whether to loop the song',
            type: 'BOOLEAN',
            required: false
        }
    ]
}

async function play(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }

    const songs = <string[]> JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf-8' })).songs

    let song: number

    if (!interaction.options.getString('name')) {
        song = Math.floor(Math.random() * (songs.length - 1))
    } else if (!songs.includes(interaction.options.getString('name'))) {
        const results = new Fuse(<string[]> JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf-8' })).songs).search(interaction.options.getString('name'))
        song = results[0].refIndex + 1
    }

    song ??= songs.findIndex(a => a === interaction.options.getString('name')) + 1

    await info.voiceManager.connect(voiceChannel)
    await info.voiceManager.playStream(createReadStream(`${process.env.data}/music_files/naruto_ost/${song}.webm`))
    if (interaction.options.getBoolean('loop')) {
        info.voiceManager.player.on('stateChange', (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle) {
                return
            }
            info.voiceManager.playStream(createReadStream(`${process.env.data}/music_files/naruto_ost/${song}.webm`))
        })
    }
    interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Now Playing!' }) ] })
}

function search(option: ApplicationCommandOptionChoice): ApplicationCommandOptionChoice[] {
    if ((<string> option.value).length < 3) {
        return
    }
    const results = new Fuse(<string[]> JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf-8' })).songs).search(<string> option.value)
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of results) {
        if (options.length > 3) {
            break
        }
        options.push({ name: result.item, value: result.item })
    }
    return options
}

module.exports = { data: data, execute: play, autocomplete: search }