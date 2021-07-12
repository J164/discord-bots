import { Message, MessageEmbed } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'
import { Euchre } from '../../../core/modules/games/Euchre'

export async function setupEuchre(message: Message): Promise<MessageEmbed> {
    const player1 = await message.guild.members.fetch({ query: message.content.split(' ')[1], limit: 1 })
    const player2 = await message.guild.members.fetch({ query: message.content.split(' ')[2], limit: 1 })
    const player3 = await message.guild.members.fetch({ query: message.content.split(' ')[3], limit: 1 })
    const player4 = await message.guild.members.fetch({ query: message.content.split(' ')[4], limit: 1 })
    const players = genericEmbedResponse('Teams')
    players.addField('Team 1:', `${player1.first().user.username}, ${player3.first().user.username}`)
    players.addField('Team 2:', `${player2.first().user.username}, ${player4.first().user.username}`)
    message.channel.send(players)
    const game = new Euchre([ player1.first().user, player2.first().user, player3.first().user, player4.first().user ])
    return game.startGame()
}

module.exports = new BaseCommand([ 'euchre' ], setupEuchre)