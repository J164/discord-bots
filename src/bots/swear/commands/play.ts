import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import { createReadStream, existsSync } from 'fs'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'play',
    description: 'Play a swear song from Swear Bot\'s database',
    options: [
        {
            name: 'number',
            description: 'The song number',
            type: 'INTEGER',
            required: false
            // todo min/max
        }
    ]
}

async function getSongs(interaction: CommandInteraction, info: GuildInfo): Promise<void> {
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        interaction.editReply({ embeds: [ generateEmbed('error', { title: 'This command can only be used while in a visable voice channel!' }) ] })
        return
    }
    const songs = <{ index: number, name: string }[]> <unknown> (await info.database.select('swear_songs')).sort((a, b) => a.index - b.index)
    let songNum
    if (interaction.options.getInteger('number') <= songs.length && interaction.options.getInteger('number') > 0) {
        songNum = interaction.options.getInteger('number') - 1
    } else {
        songNum = Math.floor(Math.random() * songs.length)
    }
    await info.voiceManager.connect(voiceChannel)
    info.voiceManager.playStream(createReadStream(existsSync(`${process.env.data}/music_files/swear_songs/${songs[songNum].name}.webm`) ? `${process.env.data}/music_files/swear_songs/${songs[songNum].name}.webm` : `${process.env.data}/music_files/swear_songs/${songs[songNum].name}.mp3`))
    interaction.editReply({ embeds: [ generateEmbed('success', { title: 'Now Playing!' }) ] })
}

export const command: Command = { data: data, execute: getSongs }