import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { genericEmbed, makeGetRequest } from '../../../core/utils/commonFunctions'
import { WynncraftData } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'wynncraft',
    description: 'Get stats for a player on Wynncraft',
    options: [ {
        name: 'player',
        description: 'The username of target player',
        type: 'STRING',
        required: true
    } ]
}

async function wynncraft(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const playerData = <WynncraftData> await makeGetRequest(`https://api.wynncraft.com/v2/player/${interaction.options.getString('player')}/stats`)
    let status
    const embedVar = genericEmbed({ title: playerData.data[0].username })
    if (playerData.data[0].meta.location.online) {
        status = `Online at: ${playerData.data[0].meta.location.server}`
        embedVar.setColor(0x33cc33)
    } else {
        status = 'Offline'
        embedVar.setColor(0xff0000)
    }
    embedVar.addField('Current Status', status)
    for (let i = 0; i < playerData.data[0].classes.length; i++) {
        let playtime = playerData.data[0].classes[i].playtime
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
        embedVar.addField(`Profile ${i + 1}`, `Class: ${playerData.data[0].classes[i].name}\nPlaytime: ${playHoursString}:${playtimeString}\nCombat Level: ${playerData.data[0].classes[i].professions.combat.level}`)
    }
    return { embeds: [ embedVar ] }
}

module.exports = { data: data, execute: wynncraft }