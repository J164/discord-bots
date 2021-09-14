import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'

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

function loop(interaction: CommandInteraction, info: PotatoGuildInputManager): InteractionReplyOptions {
    if (interaction.options.getInteger('name') === 0) {
        return info.voiceManager.loopSong()
    }
    return info.voiceManager.loopQueue()
}

module.exports = new BaseCommand(data, loop)