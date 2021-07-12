import { Message, MessageEmbed } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { makeGetRequest } from '../../../core/common'

async function getWynncraftStats(message: Message): Promise<MessageEmbed | string> {
    if (message.content.split(' ').length < 2) {
        return 'Please enter a player username!'
    }
    const data = await makeGetRequest(`https://api.wynncraft.com/v2/player/${message.content.split(' ')[1]}/stats`)
    let status
    const embedVar = new MessageEmbed()
    embedVar.setTitle(data.data[0].username)
    if (data.data[0].meta.location.online) {
        status = `Online at: ${data.data[0].meta.location.server}`
        embedVar.setColor(0x33cc33)
    } else {
        status = 'Offline'
        embedVar.setColor(0xff0000)
    }
    embedVar.addField('Current Status', status)
    for (let i = 0; i < data.data[0].classes.length; i++) {
        let playtime = data.data[0].classes[i].playtime
        const playHours = Math.floor(playtime / 60)
        playtime = playtime % 60
        let playtimeString
        let playHoursString
        if (playtime < 10) {
            playtimeString = `0${playtime}`
        } else {
            playtimeString = playtime.toString()
        }
        if (playHours < 10) {
            playHoursString = `0${playHours}`
        } else {
            playHoursString = playHours.toString()
        }
        embedVar.addField(`Profile ${i + 1}`, `Class: ${data.data[0].classes[i].name}\nPlaytime: ${playHoursString}:${playtimeString}\nCombat Level: ${data.data[0].classes[i].professions.combat.level}`)
    }
    return embedVar
}

module.exports = new BaseCommand([ 'wynncraft' ], getWynncraftStats)