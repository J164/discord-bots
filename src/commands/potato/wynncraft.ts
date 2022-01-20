import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'

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

async function wynncraft(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const playerData = <WynncraftData> await (await request(`https://api.wynncraft.com/v2/player/${interaction.options.getString('player')}/stats`)).body.json()
    const embed = generateEmbed('info', {
        title: playerData.data[0].username,
        fields: [ {
            name: 'Current Status',
            value: playerData.data[0].meta.location.online ? `Online at: ${playerData.data[0].meta.location.server}` : 'Offline',
        } ],
        color: playerData.data[0].meta.location.online ? 0x33_CC_33 : 0xFF_00_00,
    })
    for (let index = 0; index < playerData.data[0].classes.length; index++) {
        const playtime = playerData.data[0].classes[index].playtime
        const playHours = Math.floor(playtime / 60)
        const playSecs = playtime % 60
        embed.fields.push({ name: `Profile ${index + 1}`, value: `Class: ${playerData.data[0].classes[index].name}\nPlaytime: ${playHours < 10 ? `0${playHours}` : playHours}:${playSecs < 10 ? `0${playSecs}` : playSecs}\nCombat Level: ${playerData.data[0].classes[index].professions.combat.level}` })
    }
    return { embeds: [ embed ] }
}

export const command = new ChatCommand({
    name: 'wynncraft',
    description: 'Get stats for a player on Wynncraft',
    options: [ {
        name: 'player',
        description: 'The username of target player',
        type: 'STRING',
        required: true,
    } ],
}, { respond: wynncraft })