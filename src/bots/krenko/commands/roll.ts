import { Message, MessageEmbed } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'

function roll(message: Message): MessageEmbed {
    let dice = 6
    if (message.content.split(' ').length > 1) {
        const arg = parseInt(message.content.split(' ')[1])
        if (!isNaN(arg) && arg > 0) {
            dice = arg
        }
    }
    message.channel.send(`Rolling a ${dice}-sided die...`)
    const diceResult = genericEmbedResponse(`${dice}-sided die result`)
    let chanceMod = 10000
    while (100 / dice * chanceMod < 1) {
        chanceMod *= 10
    }
    diceResult.addField(`${Math.floor(Math.random() * (dice - 1) + 1)}`, `The chance of getting this result is about ${Math.round(100 / dice * chanceMod) / chanceMod}%`)
    return diceResult
}

module.exports = new BaseCommand([ 'roll', 'dice' ], roll)