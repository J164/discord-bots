import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'loop',
    description: 'Loop the current song or queue',
    options: [
        {
            name: 'current',
            description: 'Loop just the current song',
            type: 'SUB_COMMAND'
        },
        {
            name: 'queue',
            description: 'Loop the entire queue',
            type: 'SUB_COMMAND'
        }
    ]
}

function loop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (interaction.options.getSubcommand() === 'current') {
        return info.queueManager.loopSong()
    }
    return info.queueManager.loopQueue()
}

module.exports = { data: data, execute: loop }