import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'

const data: ApplicationCommandData = {
    name: 'stop',
    description: 'Stop the song'
}

function stop(interaction: CommandInteraction, info: GuildInputManager): InteractionReplyOptions {
    info.voiceManager.reset()
    return { content: 'Success' }
}

module.exports = new BaseCommand(data, stop)