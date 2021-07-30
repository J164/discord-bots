import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'np',
    description: 'Get information on the song currently playing',
}

function nowPlaying(interaction: CommandInteraction, info: PotatoGuildInputManager): InteractionReplyOptions {
    return info.voiceManager.getNowPlaying()
}

module.exports = new BaseCommand(data, nowPlaying)