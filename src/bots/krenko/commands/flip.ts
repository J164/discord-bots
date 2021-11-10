import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/commonFunctions'

const data: ApplicationCommandData = {
    name: 'flip',
    description: 'Flip a coin'
}

function flip(): InteractionReplyOptions {
    const result = Math.random()
    const flipResult = generateEmbed('info', { title: 'Flip Result:' })
    if (result >= 0.5) {
        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png')
    } else {
        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png')
    }
    return { embeds: [ flipResult ] }
}

module.exports = { data: data, execute: flip }