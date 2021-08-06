import { MessageAttachment, MessageEmbed, MessageReaction, User } from 'discord.js'
import * as axios from 'axios'
import { genericEmbedResponse, mergeImages } from '../../commonFunctions'
import { Card, EuchrePlayer, EuchreTeam } from '../../interfaces'
import { root } from '../../constants'

export class Euchre {

    private team1: EuchreTeam
    private team2: EuchreTeam
    private gameState: { top: Card; inPlay: Card[]; trump: string }
    private players: EuchrePlayer[]

    public constructor(players: User[]) {
        this.team1 = {
            tricks: 0,
            score: 0
        }
        this.team2 = {
            tricks: 0,
            score: 0
        }
        this.players = [ {
            id: 0,
            user: players[0],
            hand: [],
            team: this.team1
        },
        {
            id: 1,
            user: players[1],
            hand: [],
            team: this.team2
        },
        {
            id: 2,
            user: players[2],
            hand: [],
            team: this.team1
        },
        {
            id: 3,
            user: players[3],
            hand: [],
            team: this.team2
        } ]
        this.gameState = {
            top: null,
            inPlay: [],
            trump: ''
        }
    }

    public async startGame(): Promise<MessageEmbed> {
        await this.startRound()
        while (this.team1.score < 10 && this.team2.score < 10) {
            const newOrder = [ this.players[3], this.players[0], this.players[1], this.players[2] ]
            this.players = newOrder
            await this.startRound()
        }
        const results = genericEmbedResponse('Game Over!')
        results.addField('Players', `${this.players[0].id}, ${this.players[1].id}, ${this.players[2].id}, ${this.players[3].id}`)
        if (this.team1.score > 10) {
            results.addField('Team 1 Wins!', `${this.team1.score} - ${this.team2.score}`)
        } else {
            results.addField('Team 2 Wins!', `${this.team2.score} - ${this.team1.score}`)
        }
        return results
    }

    private async startRound(): Promise<void> {
        let draws
        let success = false
        while (!success) {
            try {
                const deck = await axios.default.post('https://deckofcardsapi.com/api/deck/new/shuffle?cards=9S,9D,9C,9H,0S,0D,0C,0H,JS,JD,JC,JH,QS,QD,QC,QH,KS,KD,KC,KH,AS,AD,AC,AH')
                draws = await axios.default.post(`https://deckofcardsapi.com/api/deck/${deck.data.deck_id}/draw?count=21`)
                success = true
            } catch(err) { console.log(err) }
        }
        const output = draws.data
        this.players[0].hand = [ output.cards[0], output.cards[4], output.cards[8], output.cards[12], output.cards[16] ]
        this.players[1].hand = [ output.cards[1], output.cards[5], output.cards[9], output.cards[13], output.cards[17] ]
        this.players[2].hand = [ output.cards[2], output.cards[6], output.cards[10], output.cards[14], output.cards[18] ]
        this.players[3].hand = [ output.cards[3], output.cards[7], output.cards[11], output.cards[15], output.cards[19] ]
        this.gameState.top = output.cards[20]
        for (const player of this.players) {
            await this.sendHand(player)
        }
        await this.sendCards( [ this.gameState.top ], 'Top of Stack:')
        const playerUsers: EuchrePlayer[] = []
        for (const player of this.players) {
            playerUsers.push(player)
        }
        for (const player of this.players) {
            const response = await this.askPlayer(player.user, `Would you like to pass or have ${this.players[3].user.username} pick it up?`, [ 'Pick it up', 'Pass' ])
            if (response === 0) {
                this.gameState.trump = this.gameState.top.suit
                this.players[3].hand[await this.askPlayer(this.players[3].user, 'What card would you like to replace?', this.getCardNames(this.players[3].hand))] = this.gameState.top
                this.sendHand(this.players[3])
                if (await this.askPlayer(player.user, 'Would you like to go alone?', [ 'Yes', 'No' ]) === 0) {
                    switch (player.id) {
                        case 0:
                            playerUsers.splice(2, 1)
                            break
                        case 1:
                            playerUsers.splice(3, 1)
                            break
                        case 2:
                            playerUsers.splice(0, 1)
                            break
                        case 3:
                            playerUsers.splice(1, 1)
                            break
                        default:
                            throw Error()
                    }
                    await this.tricks(playerUsers, player.team, true)
                    return
                }
                await this.tricks(playerUsers, player.team, false)
                return
            }
        }
        const availableSuits: string[] = [ 'Hearts', 'Diamonds', 'Clubs', 'Spades', 'Pass' ]
        availableSuits.splice(availableSuits.indexOf(`${this.gameState.top.suit[0]}${this.gameState.top.suit.slice(1).toLowerCase()}`), 1)
        for (const [ i, player ] of this.players.entries()) {
            if (i === 3) {
                availableSuits.splice(availableSuits.length - 1, 1)
            }
            const response = await this.askPlayer(player.user, 'What would you like to be trump?', availableSuits)
            if (response !== 3) {
                this.gameState.trump = availableSuits[response].toUpperCase()
                if (await this.askPlayer(player.user, 'Would you like to go alone?', [ 'Yes', 'No' ]) === 0) {
                    switch (player.id) {
                        case 0:
                            playerUsers.splice(2, 1)
                            break
                        case 1:
                            playerUsers.splice(3, 1)
                            break
                        case 2:
                            playerUsers.splice(0, 1)
                            break
                        case 3:
                            playerUsers.splice(1, 1)
                            break
                        default:
                            throw Error()
                    }
                    await this.tricks(playerUsers, player.team, true)
                    return
                }
                await this.tricks(playerUsers, player.team, false)
                return
            }
        }
    }

    private async tricks(activePlayers: EuchrePlayer[], leader: EuchreTeam, solo: boolean): Promise<void> {
        for (let r = 0; r < 5; r++) {
            const table: Card[] = []
            let lead: string
            for (const player of activePlayers) {
                await this.sendHand(player)
                if (!lead && table.length > 0) {
                    lead = table[0].suit
                }
                let availableHand: Card[] = []
                const handIndices: number[] = []
                let hasLead = false
                if (lead) {
                    for (const [ i, card ] of player.hand.entries()) {
                        if (this.realSuit(card) === lead) {
                            availableHand.push(card)
                            handIndices.push(i)
                            hasLead = true
                        }
                    }
                    if (!hasLead) {
                        availableHand = player.hand
                        for (let i = 0; i < availableHand.length; i++) {
                            handIndices.push(i)
                        }
                    }
                } else {
                    availableHand = player.hand
                    for (let i = 0; i < availableHand.length; i++) {
                        handIndices.push(i)
                    }
                }
                const response = await this.askPlayer(player.user, 'What would you like to play?', this.getCardNames(availableHand))
                table.push(availableHand[response])
                player.hand.splice(handIndices[response], 1)
                await this.sendHand(player)
                await this.sendCards(table, 'Table:')
            }
            let leadingPlayer: EuchrePlayer
            let leadingScore = 0
            for (const [ i, card ] of table.entries()) {
                if (this.realSuit(card) === this.gameState.trump) {
                    switch (card.code[0]) {
                        case '9':
                            if (leadingScore < 7) {
                                leadingScore = 7
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case '10':
                            if (leadingScore < 8) {
                                leadingScore = 8
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'Q':
                            if (leadingScore < 9) {
                                leadingScore = 9
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'K':
                            if (leadingScore < 10) {
                                leadingScore = 10
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'A':
                            if (leadingScore < 11) {
                                leadingScore = 11
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'J':
                            if (this.realSuit(card) === card.suit && leadingScore > 13) {
                                leadingScore = 13
                                leadingPlayer = activePlayers[i]
                            } else if (leadingScore < 12) {
                                leadingScore = 12
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        default:
                            throw Error()
                    }
                } else if (card.suit === lead) {
                    switch (card.code[0]) {
                        case '9':
                            if (leadingScore < 1) {
                                leadingScore = 1
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case '10':
                            if (leadingScore < 2) {
                                leadingScore = 2
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'J':
                            if (leadingScore < 3) {
                                leadingScore = 3
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'Q':
                            if (leadingScore < 4) {
                                leadingScore = 4
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'K':
                            if (leadingScore < 5) {
                                leadingScore = 5
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'A':
                            if (leadingScore < 6) {
                                leadingScore = 6
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        default:
                            throw Error()
                    }
                }
            }
            if (leadingPlayer.id % 2 === 0) {
                this.team1.tricks++
            } else {
                this.team2.tricks++
            }
            const tricksWon = genericEmbedResponse('Tricks Won:')
            tricksWon.addField('Team 1:', this.team1.tricks.toString())
            tricksWon.addField('Team 2:', this.team2.tricks.toString())
            for (const player of this.players) {
                const channel = await player.user.createDM()
                await channel.send({ embeds: [ tricksWon ] })
            }
        }
        let winningTeam: EuchreTeam
        if (this.team1.tricks > this.team2.tricks) {
            winningTeam = this.team1
        } else {
            winningTeam = this.team2
        }
        if (winningTeam === leader) {
            if (winningTeam.tricks === 5) {
                if (solo) {
                    winningTeam.score += 4
                } else {
                    winningTeam.score += 2
                }
            } else {
                winningTeam.score++
            }
        } else {
            winningTeam.score += 2
        }
        const standings = genericEmbedResponse('Tricks Won:')
        standings.addField('Team 1:', this.team1.score.toString())
        standings.addField('Team 2:', this.team2.score.toString())
        for (const player of this.players) {
            const channel = await player.user.createDM()
            await channel.send({ embeds: [ standings ] })
        }
    }

    private realSuit(card: Card): string {
        if (card.code[0] !== 'J') {
            return card.suit
        }
        switch (card.suit) {
            case 'CLUBS':
                if (this.gameState.trump === 'SPADES') {
                    return 'SPADES'
                }
                break
            case 'SPADES':
                if (this.gameState.trump === 'CLUBS') {
                    return 'CLUBS'
                }
                break
            case 'HEARTS':
                if (this.gameState.trump === 'DIAMONDS') {
                    return 'DIAMOND'
                }
                break
            case 'DIAMONDS':
                if (this.gameState.trump === 'HEARTS') {
                    return 'HEARTS'
                }
                break
            default:
                throw Error()
        }
        return card.suit
    }

    private getCardNames(hand: Card[]): string[] {
        const names: string[] = []
        for (const card of hand) {
            names.push(`${card.value[0]}${card.value.slice(1).toLowerCase()} of ${card.suit[0]}${card.suit.slice(1).toLowerCase()}`)
        }
        return names
    }

    private async askPlayer(player: User, question: string, responses: string[]): Promise<number> {
        const channel = await player.createDM()
        const prompt = genericEmbedResponse(question)
        for (let i = 0; i < responses.length; i++) {
            prompt.addField(`${i + 1}. `, responses[i])
        }
        const message = await channel.send({ embeds: [ prompt ] })
        const emojiList = [ '1\ufe0f\u20e3', '2\ufe0f\u20e3', '3\ufe0f\u20e3', '4\ufe0f\u20e3', '5\ufe0f\u20e3', '6\ufe0f\u20e3', '7\ufe0f\u20e3', '8\ufe0f\u20e3', '9\ufe0f\u20e3', '\ud83d\udd1f' ]
        for (let i = 0; i < responses.length; i++) {
            await message.react(emojiList[i])
        }
        function filter(reaction: MessageReaction): boolean { return reaction.client === message.client }
        const reactionCollection = await message.awaitReactions({ filter: filter, max: 1 })
        const reactionResult = reactionCollection.first()
        for (let i = 0; i < emojiList.length; i++) {
            if (reactionResult.emoji.name === emojiList[i]) {
                return i
            }
        }
    }

    private async sendHand(player: EuchrePlayer): Promise<void> {
        const filePaths: string[] = []
        const hand = genericEmbedResponse('^ Your Hand:')
        for (const card of player.hand) {
            filePaths.push(`${root}/assets/img/cards/${card.code}.png`)
        }
        if (filePaths.length === 1) {
            const card = new MessageAttachment(filePaths[0], 'hand.png')
            hand.setImage('attachment://hand.png')
            const channel = await player.user.createDM()
            await channel.send({ embeds: [ hand ], files: [ card ] })
            return
        }
        const image = new MessageAttachment(await mergeImages(filePaths, {
            width: filePaths.length * 226,
            height: 314
        }), 'hand.jpg')
        hand.setImage('attachment://hand.jpg')
        const channel = await player.user.createDM()
        await channel.send({ embeds: [ hand ], files: [ image ] })
    }

    private async sendCards(cards: Card[], message: string): Promise<void> {
        const response = genericEmbedResponse(`^ ${message}`)
        const filePaths: string[] = []
        for (const card of cards) {
            filePaths.push(`${root}/assets/img/cards/${card.code}.png`)
        }
        const image = new MessageAttachment(await mergeImages(filePaths, {
            width: filePaths.length * 226,
            height: 314
        }), 'cards.jpg')
        response.setImage('attachment://cards.jpg')
        for (const player of this.players) {
            const channel = await player.user.createDM()
            await channel.send({ embeds: [ response ], files: [ image ] })
        }
    }
}