import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { existsSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { home } from '../../../core/constants'
import { SwearSongInfo } from '../../../core/interfaces'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Play a swear song from Swear Bot\'s database',
    options: [
        {
            name: 'number',
            description: 'The song number',
            type: 'INTEGER',
            required: false
        },
        {
            name: 'name',
            description: 'The name of the song',
            type: 'STRING',
            required: false
        }
    ]
}

async function play(interaction: CommandInteraction, info: SwearGuildInputManager, songs: SwearSongInfo[]): Promise<void> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        interaction.editReply({ content: 'This command can only be used while in a visable voice channel!' })
        return
    }
    let songNum
    if (interaction.options.getInteger('number') <= songs.length && interaction.options.getInteger('number') > 0) {
        songNum = interaction.options.getInteger('number') - 1
    } else if (interaction.options.getString('name')) {
        for (const [ i, song ] of songs.entries()) {
            if (song.name.toLowerCase() === interaction.options.getString('name')) {
                songNum = i
                break
            }
        }
    } else {
        songNum = Math.floor(Math.random() * songs.length)
    }
    await info.voiceManager.connect(voiceChannel)
    if (existsSync(`${home}/music_files/swear_songs/${songs[songNum].name}.webm`)) {
        info.voiceManager.createStream(`${home}/music_files/swear_songs/${songs[songNum].name}.webm`)
    } else {
        info.voiceManager.createStream(`${home}/music_files/swear_songs/${songs[songNum].name}.mp3`)
    }
    interaction.editReply({ content: 'Now Playing!' })
}

function getSongs(interaction: CommandInteraction, info: SwearGuildInputManager): void {
    info.database.customSelect('swear_songs', 'index', results => {
        play(interaction, info, <SwearSongInfo[]> results)
    })
}

module.exports = new BaseCommand(data, getSongs)