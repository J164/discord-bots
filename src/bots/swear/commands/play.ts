import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { userData, home } from '../../../core/common'
import { SwearGuildInputManager } from '../SwearGuildInputManager'

let implementName: any

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

async function play(interaction: CommandInteraction, info: SwearGuildInputManager): Promise<InteractionReplyOptions> {
    let songNum
    const member = await interaction.guild.members.fetch(interaction.user)
    const voiceChannel = member.voice.channel
    if (!voiceChannel?.joinable || voiceChannel.type === 'GUILD_STAGE_VOICE') {
        return { content: 'This command can only be used while in a visable voice channel!' }
    }
    if (interaction.options.getInteger('number') <= userData.swearSongs.length && interaction.options.getInteger('number') > 0) {
            songNum = interaction.options.getInteger('number') - 1
    } else {
        songNum = Math.floor(Math.random() * userData.swearSongs.length)
    }
    await info.voiceManager.connect(voiceChannel)
    info.voiceManager.createStream(`${home}/music_files/swear_songs/${userData.swearSongs[songNum]}`)
    return { content: 'Now Playing!' }
}

module.exports = new BaseCommand(data, play)