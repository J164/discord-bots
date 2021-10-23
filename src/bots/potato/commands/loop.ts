import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'loop',
    description: 'Loop the current song or queue',
    options: [
        {
            name: 'name',
            description: 'What to loop',
            type: 'INTEGER',
            required: true,
            choices: [
                {
                    name: 'current song',
                    value: 0
                },
                {
                    name: 'queue',
                    value: 1
                }
            ]
        }
    ]
}

function loop(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (interaction.options.getInteger('name') === 0) {
        return info.queueManager.loopSong()
    }
    return info.queueManager.loopQueue()
}

module.exports = { data: data, execute: loop }