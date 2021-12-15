import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command } from '../../../core/utils/interfaces.js'

interface WynncraftData {
    readonly data: readonly {
        readonly username: string,
        readonly meta: {
            readonly location: {
                readonly online: boolean
                readonly server: string
            }
        }
        readonly classes: readonly {
            readonly name: string
            readonly playtime: number
            readonly professions: {
                readonly combat: {
                    readonly level: number
                }
            }
        }[]
    }[]
}

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
    const playerData = <WynncraftData> await (await request(`https://api.wynncraft.com/v2/player/${interaction.options.getString('player')}/stats`)).body.json()
    const embedVar = generateEmbed('info', {
        title: playerData.data[0].username,
        fields: [ {
            name: 'Current Status',
            value: playerData.data[0].meta.location.online ? `Online at: ${playerData.data[0].meta.location.server}` : 'Offline'
        } ],
        color: playerData.data[0].meta.location.online ? 0x33cc33 : 0xff0000
    })
    for (let i = 0; i < playerData.data[0].classes.length; i++) {
        const playtime = playerData.data[0].classes[i].playtime
        const playHours = Math.floor(playtime / 60)
        const playSecs = playtime % 60
        embedVar.fields.push({ name: `Profile ${i + 1}`, value: `Class: ${playerData.data[0].classes[i].name}\nPlaytime: ${playHours < 10 ? `0${playHours}` : playHours}:${playSecs < 10 ? `0${playSecs}` : playSecs}\nCombat Level: ${playerData.data[0].classes[i].professions.combat.level}` })
    }
    return { embeds: [ embedVar ] }
}

export const command: Command = { data: data, execute: wynncraft }