import {InteractionReplyOptions } from 'discord.js'
import { createReadStream, existsSync } from 'node:fs'
import { generateEmbed } from '../../core/utils/generators.js'
import process from 'node:process'
import { GuildChatCommand, GuildChatCommandInfo } from '../../core/utils/interfaces.js'

async function getSongs(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
    const member = await info.interaction.guild.members.fetch(info.interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type !== 'GUILD_VOICE') {
        void info.interaction.editReply({ embeds: [ generateEmbed('error', { title: 'This command can only be used while in a visable voice channel!' }) ] })
        return
    }
    const songs = (await info.database.select('swear_songs')).sort((a, b) => a.index - b.index) as unknown as { index: number, name: string }[]
    const songNumber = info.interaction.options.getInteger('number') && info.interaction.options.getInteger('number') <= songs.length ? info.interaction.options.getInteger('number') - 1 : Math.floor(Math.random() * songs.length)
    await info.voiceManager.connect(voiceChannel)
    await info.voiceManager.playStream(createReadStream(existsSync(`${process.env.DATA}/music_files/swear_songs/${songs[songNumber].name}.webm`) ? `${process.env.DATA}/music_files/swear_songs/${songs[songNumber].name}.webm` : `${process.env.DATA}/music_files/swear_songs/${songs[songNumber].name}.mp3`))
    return { embeds: [ generateEmbed('success', { title: 'Now Playing!' }) ] }
}

export const command = new GuildChatCommand({
    name: 'play',
    description: 'Play a swear song from Swear Bot\'s database',
    options: [
        {
            name: 'number',
            description: 'The song number',
            type: 'INTEGER',
            minValue: 0,
            required: false,
        },
    ],
}, { respond: getSongs })