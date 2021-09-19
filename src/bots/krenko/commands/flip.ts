import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbed } from '../../../core/commonFunctions'

const data: ApplicationCommandData = {
    name: 'flip',
    description: 'Flip a coin'
}

function flip(): InteractionReplyOptions {
    const result = Math.random()
    const flipResult = genericEmbed({ title: 'Flip Result:' })
    if (result >= 0.5) {
        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png')
    } else {
        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png')
    }
    return { embeds: [ flipResult ] }
}

module.exports = new BaseCommand(data, flip)