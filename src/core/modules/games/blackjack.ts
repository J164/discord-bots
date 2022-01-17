import { ButtonInteraction, CollectorFilter, DMChannel, MessageOptions } from 'discord.js'
import { multicardMessage } from '../../utils/card-utils.js'
import { Card, Deck } from '../../utils/deck.js'
import { generateEmbed } from '../../utils/generators.js'

type Result = 'Bust' | 'Push' | 'Blackjack' | 'Win' | 'Lose'

export async function playBlackjack(channel: DMChannel): Promise<void> {
    const dealer = Deck.randomCard({ number: 2, values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })
    const player = Deck.randomCard({ number: 2, values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })

    const filter: CollectorFilter<[ButtonInteraction]> = b => b.customId.startsWith('blackjack')
    const prompt = async () => {
        await channel.send({ ...await printStandings(player, dealer), components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-hit', style: 'PRIMARY', label: 'Hit' }, { type: 'BUTTON', customId: 'blackjack-stand', style: 'SECONDARY', label: 'Stand' } ] } ] })
        await new Promise<void>((resolve) => {
            channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON' }).once('collect', async b => {
                void b.update({ components: [] })
                if (b.customId === 'blackjack-hit') {
                    if (hit(player) === -1) {
                        resolve()
                        return
                    }
                    await prompt()
                }
                resolve()
            })
        })
    }
    await prompt()

    const finish = finishGame(player, dealer)
    const standings = await printStandings(player, dealer, true)

    switch (finish) {
        case 'Bust':
            await channel.send({ embeds: [ generateEmbed('info', { title: 'Bust! (You went over 21)' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
            break
        case 'Push':
            await channel.send({ embeds: [ generateEmbed('info', { title: 'Push! (You tied with the dealer)' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
            break
        case 'Blackjack':
            await channel.send({ embeds: [ generateEmbed('info', { title: 'Blackjack!' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
            break
        case 'Win':
            await channel.send({ embeds: [ generateEmbed('info', { title: 'Win!' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
            break
        case 'Lose':
            await channel.send({ embeds: [ generateEmbed('info', { title: 'Lose!' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
            break
    }

    channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON' }).once('collect', b => {
        void b.update({ components: [] })
        if (b.customId === 'blackjack-continue') {
            void playBlackjack(channel)
        }
    })
}

function scoreHand(hand: Card[]): number {
    let numberAces = 0
    let score = 0
    for (const card of hand) {
        if (card.name === 'ace') {
            numberAces++
        }
        score += card.value
    }

    while (score > 21 && numberAces > 0) {
        numberAces--
        score -= 10
    }

    return score
}

function hit(player: Card[]): number {
    player.push(Deck.randomCard({ values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })[0])
    const score = scoreHand(player)
    if (score > 21) return -1
    return score
}

async function printStandings(player: Card[], dealer: Card[], gameEnd?: boolean): Promise<MessageOptions> {
    const { embed: playerEmbed, file: playerFile } = await multicardMessage(player, 'info', { title: 'Player', fields: [ { name: 'Value:', value: scoreHand(player).toString(), inline: true } ] }, 'player')
    const { embed: dealerEmbed, file: dealerFile } = await multicardMessage(gameEnd ? dealer : [ dealer[0], { code: 'back' } ], 'info', { title: 'Dealer', fields: [ { name: 'Value:', value: scoreHand(gameEnd ? dealer : [ dealer[0] ]).toString(), inline: true } ] }, 'dealer')
    return { embeds: [ playerEmbed, dealerEmbed ], files: [ playerFile, dealerFile ] }
}

function finishGame(player: Card[], dealer: Card[]): Result {
    while (scoreHand(dealer) < 17) {
        dealer.push(Deck.randomCard({ values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })[0])
    }

    const playerScore = scoreHand(player)
    const dealerScore = scoreHand(dealer)

    if (playerScore > 21) return 'Bust'

    if (playerScore === dealerScore) return 'Push'

    if (playerScore === 21) return 'Blackjack'

    if (playerScore > dealerScore || dealerScore > 21) return 'Win'

    return 'Lose'
}