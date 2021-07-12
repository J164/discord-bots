import { Message, MessageEmbed } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

function nowPlaying(message: Message, info: PotatoGuildInputManager): string | MessageEmbed {
    return info.voiceManager.getNowPlaying()
}

module.exports = new BaseCommand([ 'nowplaying', 'np' ], nowPlaying)