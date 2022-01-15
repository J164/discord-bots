import { ButtonInteraction, CollectorFilter, MessageOptions, ThreadChannel } from 'discord.js'
import { BaseGame } from '../../utils/base-game.js'
import { multicardMessage } from '../../utils/card-utils.js'
import { Card, Deck } from '../../utils/deck.js'
import { generateEmbed } from '../../utils/generators.js'

type Result = 'Win' | 'Lose' | 'Blackjack' | 'Push' | 'Bust'

export class Blackjack extends BaseGame {

    public readonly type = 'BLACKJACK'
    private readonly _dealer: Card[]
    private readonly _player: Card[]

    private static _scoreHand(hand: Card[]): number {
        let numberAces = 0
        let score = 0
        for (const card of hand) {
            if (card.name === 'ace') {
                numberAces++
            }
            score += card.value
        }

        while (score > 21 && numberAces > 0) {
            numberAces --
            score -= 10
        }

        return score
    }

    public constructor(gameChannel: ThreadChannel) {
        super(gameChannel)
        this._dealer = Deck.randomCard({ number: 2, values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })
        this._player = Deck.randomCard({ number: 2, values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })
    }

    public async play(): Promise<void> {
        const filter: CollectorFilter<[ButtonInteraction]> = b => b.customId.startsWith('blackjack')
        const prompt = async () => {
            await this._gameChannel.send({ ...await this._printStandings(), components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-hit', style: 'PRIMARY', label: 'Hit' }, { type: 'BUTTON', customId: 'blackjack-stand', style: 'SECONDARY', label: 'Stand' } ] } ] })
            await new Promise<void>((resolve) => {
                this._gameChannel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON' }).once('collect', async b => {
                    void b.update({ components: [] })
                    if (b.customId === 'blackjack-hit') {
                        if (this._hit() === -1) {
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

        const finish = this._finishGame()
        const standings = await this._printStandings(true)

        switch (finish) {
            case 'Bust':
                await this._gameChannel.send({ embeds: [ generateEmbed('info', { title: 'Bust! (You went over 21)' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
                break
            case 'Push':
                await this._gameChannel.send({ embeds: [ generateEmbed('info', { title: 'Push! (You tied with the dealer)' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
                break
            case 'Blackjack':
                await this._gameChannel.send({ embeds: [ generateEmbed('info', { title: 'Blackjack!' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
                break
            case 'Win':
                await this._gameChannel.send({ embeds: [ generateEmbed('info', { title: 'Win!' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
                break
            case 'Lose':
                await this._gameChannel.send({ embeds: [ generateEmbed('info', { title: 'Lose!' }), ...standings.embeds ], files: standings.files, components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', customId: 'blackjack-continue', label: 'Play Again?', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'blackjack-end', label: 'Cash Out', style: 'SECONDARY' } ] } ] })
                break
        }

        this._gameChannel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON' }).once('collect', b => {
            void b.update({ components: [] })
            if (b.customId === 'blackjack-continue') {
                void this.play()
                return
            }
            this.end()
        })
    }

    private _hit(): number {
        this._player.push(Deck.randomCard({ values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })[0])
        const score = Blackjack._scoreHand(this._player)
        if (score > 21) return -1
        return score
    }

    private async _printStandings(gameEnd?: boolean): Promise<MessageOptions> {
        const { embed: playerEmbed, file: playerFile } = await multicardMessage(this._player, 'info', { title: 'Player', fields: [ { name: 'Value:', value: Blackjack._scoreHand(this._player).toString(), inline: true } ] }, 'player')
        const { embed: dealerEmbed, file: dealerFile } = await multicardMessage(gameEnd ? this._dealer : [ ...this._dealer.slice(0, 1), { code: 'back' } ], 'info', { title: 'Dealer', fields: [ { name: 'Value:', value: Blackjack._scoreHand(gameEnd ? this._dealer : this._dealer.slice(0, 1)).toString(), inline: true } ] }, 'dealer')
        return { embeds: [ playerEmbed, dealerEmbed ], files: [ playerFile, dealerFile ]}
    }

    private _finishGame(): Result {
        while (Blackjack._scoreHand(this._dealer) < 17) {
            this._dealer.push(Deck.randomCard({ values: [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11 ] })[0])
        }

        const playerScore = Blackjack._scoreHand(this._player)
        const dealerScore = Blackjack._scoreHand(this._dealer)

        if (playerScore > 21) return 'Bust'

        if (playerScore === dealerScore) return 'Push'

        if (playerScore === 21) return 'Blackjack'

        if (playerScore > dealerScore || dealerScore > 21) return 'Win'

        return 'Lose'
    }
}