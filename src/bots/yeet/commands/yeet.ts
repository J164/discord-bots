import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'

const data: ApplicationCommandData = {
    name: 'yeet',
    description: 'Ask Yeet Bot to yell YEET!',
    options: [ {
        name: 'power',
        description: 'How powerful the yeet should be',
        type: 'INTEGER',
        required: false
    } ]
}

function yeet(interaction: CommandInteraction): InteractionReplyOptions {
    if (!interaction.options.getInteger('power')) {
        return { content: 'YEET!' }
    }
    let e = ''
    for (let i = 0; i < interaction.options.getInteger('power'); i++) {
        e += 'E'
        // todo use message limit
        if (i > 1995) {
            break
        }
    }
    return { content: `Y${e}T!` }
}

module.exports = { data: data, execute: yeet }