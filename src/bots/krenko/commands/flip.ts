import { MessageEmbed } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'

function flip(): MessageEmbed {
    const result = Math.random()
    const flipResult = genericEmbedResponse('Flip Result:')
    if (result >= 0.5) {
        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png')
    } else {
        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png')
    }
    return flipResult
}

module.exports = new BaseCommand([ 'flip', 'coin' ], flip)