import { ButtonInteraction, CollectorFilter, MessageSelectOptionData, SelectMenuInteraction, ThreadChannel, User } from 'discord.js'
import { generateEmbed } from '../../utils/generators.js'
import { BaseGame } from '../../utils/base-game.js'
import { multicardMessage } from '../../utils/card-utils.js'
import { Card, Deck, Suit } from '../../utils/deck.js'

interface EuchreTeam {
    tricks: number;
    score: number;
    name: 'Team 1' | 'Team 2'
}

interface EuchrePlayer {
    hand?: Card[]
    readonly team: EuchreTeam
    readonly user: User
    out: boolean
}

export class Euchre extends BaseGame {

    private readonly _team1: EuchreTeam
    private readonly _team2: EuchreTeam
    private _trump: Suit
    private readonly _players: EuchrePlayer[]

    public constructor(players: User[], gameChannel: ThreadChannel) {
        super(gameChannel)
        this._team1 = { tricks: 0, score: 0, name: 'Team 1' }
        this._team2 = { tricks: 0, score: 0, name: 'Team 2' }
        this._players = [ { team: this._team1, user: players[0], out: false }, { team: this._team2, user: players[1], out: false }, { team: this._team1, user: players[2], out: false }, { team: this._team2, user: players[3], out: false } ]
    }

    public async startRound(): Promise<void> {
        await this.gameChannel.send({ embeds: [ generateEmbed('info', {
            title: 'Player Order',
            fields: [
                {
                    name: `1. ${this._players[0].user.username}`,
                    value: this._players[0].team.name
                },
                {
                    name: `2. ${this._players[1].user.username}`,
                    value: this._players[1].team.name
                },
                {
                    name: `3. ${this._players[2].user.username}`,
                    value: this._players[2].team.name
                },
                {
                    name: `4. ${this._players[3].user.username}`,
                    value: this._players[3].team.name
                }
            ]
        }) ] })
        const deck = new Deck([ '9S', '9D', '9C', '9H', '0S', '0D', '0C', '0H', 'JS', 'JD', 'JC', 'JH', 'QS', 'QD', 'QC', 'QH', 'KS', 'KD', 'KC', 'KH', 'AS', 'AD', 'AC', 'AH' ])
        deck.shuffle()
        const draws = deck.draw(21)
        for (const [ index, player ] of this._players.entries()) {
            player.hand = []
            for (let r = index; r < 17 + index; r += 4) {
                player.hand.push(draws[r])
            }
        }
        const top = draws[20]
        for (const player of this._players) {
            const channel = await player.user.createDM()
            await channel.send(await multicardMessage(player.hand, 'info', { title: 'Your Hand:' }))
        }
        await this.gameChannel.send(await multicardMessage([ top ], 'info', { title: 'Top of Stack:' }))

        const promptThree = async (index: number): Promise<void> => {
            const channel = await this._players[index].user.createDM()
            await channel.send({ embeds: [ generateEmbed('prompt', { title: 'Would you like to go alone?' }) ], components: [ { components: [ { type: 'BUTTON', customId: 'three-yes', label: 'Yes', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'three-no', label: 'No', style: 'SECONDARY' } ], type: 'ACTION_ROW' } ] })
            const filter: CollectorFilter<[ButtonInteraction]> = b => b.customId.startsWith('three-')
            const collector = channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON', max: 1 })
            collector.once('collect', async interaction => {
                await interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [] })
                if (interaction.customId === 'three-yes') {
                    this._players.find(player => player.team === this._players[index].team && !player.user.equals(this._players[index].user)).out = true
                    return this._round(index, true)
                }
                void this._round(index)
            })
        }

        const promptTwo = async (index = 0): Promise<void> => {
            const channel = await this._players[index].user.createDM()
            const { embeds, files } = await multicardMessage(this._players[index].hand, 'prompt', { title: 'Would you like to pass or select trump?' })
            if (index === 3) {
                embeds[0].title = 'Please select trump'
                await channel.send({ embeds: embeds, files: files, components: [ { components: [ { type: 'SELECT_MENU', customId: 'two-select', placeholder: 'Select a Suit', options: [ { label: 'Spades', value: 'Spades', emoji: '\u2660\uFE0F' }, { label: 'Clubs', value: 'Clubs', emoji: '\u2663\uFE0F' }, { label: 'Hearts', value: 'Hearts', emoji: '\u2665\uFE0F' }, { label: 'Diamonds', value: 'Diamonds', emoji: '\u2666\uFE0F' } ] } ], type: 'ACTION_ROW' } ] })
            } else {
                await channel.send({ embeds: embeds, files: files, components: [ { components: [ { type: 'SELECT_MENU', customId: 'two-select', placeholder: 'Select a Suit', options: [ { label: 'Spades', value: 'Spades', emoji: '\u2660\uFE0F' }, { label: 'Clubs', value: 'Clubs', emoji: '\u2663\uFE0F' }, { label: 'Hearts', value: 'Hearts', emoji: '\u2665\uFE0F' }, { label: 'Diamonds', value: 'Diamonds', emoji: '\u2666\uFE0F' } ] } ], type: 'ACTION_ROW' }, { components: [ { type: 'BUTTON', customId: 'two-pass', label: 'Pass', style: 'SECONDARY' } ], type: 'ACTION_ROW' } ] })
            }
            const filter: CollectorFilter<[ButtonInteraction | SelectMenuInteraction]> = b => b.customId.startsWith('two-')
            const collector1 = channel.createMessageComponentCollector({ filter: filter, componentType: 'SELECT_MENU', max: 1 })
            const collector2 = channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON', max: 1 })
            collector1.once('collect', async interaction => {
                collector2.stop()
                collector2.removeAllListeners()
                await interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                this._trump = top.suit
                void promptThree(index)
            })
            collector2.once('collect', async interaction => {
                collector1.stop()
                collector1.removeAllListeners()
                await interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                return promptTwo(index + 1)
            })
        }

        const promptReplace = async (index: number): Promise<void> => {
            const options: MessageSelectOptionData[] = []
            for (const[ id, card ] of this._players[3].hand.entries()) {
                options.push({ label: `${card.value} of ${card.suit}`, value: id.toString() })
            }
            const channel = await this._players[3].user.createDM()
            const { embeds, files } = await multicardMessage(this._players[3].hand, 'prompt', { title: 'Select a card to replace' })
            await channel.send({ embeds: embeds, files: files, components: [ { components: [ { type: 'SELECT_MENU', customId: 'replace', placeholder: 'Select a Card', options: options } ], type: 'ACTION_ROW' } ] })
            const filter: CollectorFilter<[SelectMenuInteraction]> = b => b.customId === 'replace'
            const collector = channel.createMessageComponentCollector({ filter: filter, componentType: 'SELECT_MENU', max: 1 })
            collector.once('collect', async interaction => {
                await interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                this._players[3].hand.splice(Number.parseInt(interaction.values[0]), 1, top)
                this._trump = top.suit
                void promptThree(index)
            })
        }

        const promptOne = async (index = 0): Promise<void> => {
            const channel = await this._players[index].user.createDM()
            await channel.send({ embeds: [ generateEmbed('prompt', { title: index === 3 ? `Would you like to pass or pick it up?` : `Would you like to pass or have ${this._players[3].user.username} pick it up?`, image: { url: top.image } }) ], components: [ { components: [ { type: 'BUTTON', customId: 'one-pickup', label: 'Pick It Up', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'one-pass', label: 'Pass', style: 'SECONDARY' } ], type: 'ACTION_ROW' } ] })
            const filter: CollectorFilter<[ButtonInteraction]> = b => b.customId.startsWith('one-')
            const collector = channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON', max: 1 })
            collector.once('collect', async interaction => {
                await interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [] })
                if (interaction.customId === 'one-pass') {
                    if (index === 3) {
                        return promptTwo()
                    }
                    return promptOne(index + 1)
                }
                void promptReplace(index)
            })
        }

       void promptOne()
    }

    private async _round(leader: number, solo = false, table: string[] = [], lead?: 'H' | 'D' | 'S' | 'C', index = 0): Promise<void> {
        if (this._players[index].out) {
            if (index === 3) {
                return
            }
            return this._round(leader, solo, table, lead, index + 1)
        }
        const legalPlays: MessageSelectOptionData[] = []
        for (const card of this._players[index].hand) {
            if (!lead || lead === this._realSuit(card)[0]) {
                legalPlays.push({ label: `${card.value} of ${card.suit}`, value: card.code })
            }
        }
        if (legalPlays.length === 0) {
            for (const card of this._players[index].hand) {
                legalPlays.push({ label: `${card.value} of ${card.suit}`, value: card.code })
            }
        }
        const channel = await this._players[index].user.createDM()
        const { embeds, files } = await multicardMessage(this._players[index].hand, 'prompt', { title: 'Select a card to play' })
        await channel.send({ embeds: embeds, files: files, components: [ { components: [ { type: 'SELECT_MENU', customId: 'play', placeholder: 'Select a Card', options: legalPlays } ], type: 'ACTION_ROW' } ] })
        const filter: CollectorFilter<[SelectMenuInteraction]> = b => b.customId.startsWith('play')
        const collector = channel.createMessageComponentCollector({ filter: filter, componentType: 'SELECT_MENU', max: 1 })
        collector.once('collect', async interaction => {
            await interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
            table.push(interaction.values[0])
            lead ??= <'H' | 'D' | 'S' | 'C'>interaction.values[0][1]
            this._players[index].hand.splice(this._players[index].hand.findIndex(c => c.code === interaction.values[0]), 1)
            if (index === 3) {
                return this._determineTrick(table, lead, leader, solo)
            }
            return this._round(leader, solo, table, lead, index + 1)
        })
    }

    private async _score(leader: number, solo: boolean): Promise<void> {
        const winningTeam = this._team1.tricks > this._team2.tricks ? this._team1 : this._team2
        if (winningTeam !== this._players[leader].team) {
            winningTeam.score += 2
        } else if (winningTeam.tricks === 5) {
            winningTeam.score += solo ? 4 : 2
        } else {
            winningTeam.score ++
        }
        if (winningTeam.score >= 10) {
            return this._finish(winningTeam)
        }
        await this.gameChannel.send({ embeds: [ generateEmbed('info', {
            title: 'Standings',
            fields: [
                {
                    name: 'Team 1',
                    value: `${this._team1.score} points`
                },
                {
                    name: 'Team 2',
                    value: `${this._team2.score} points`
                }
            ]
        }) ] })
        this._players.unshift(this._players.pop())
        for (const player of this._players) {
            player.out = false
        }
        void this.startRound()
    }

    private async _finish(winningTeam: EuchreTeam): Promise<void> {
        const embed = generateEmbed('info', {
            title: `${winningTeam.name} Wins!`,
            fields: [
                {
                    name: 'Team 1',
                    value: `${this._team1.score} points`
                },
                {
                    name: 'Team 2',
                    value: `${this._team2.score} points`
                }
            ]
        })
        await this.gameChannel.send({ embeds: [ embed ] })
        this.end()
    }

    // eslint-disable-next-line complexity
    private async _determineTrick(table: string[], lead: 'H' | 'D' | 'S' | 'C', leader: number, solo: boolean): Promise<void> {
        let leadingPlayer: number
        let leadingScore = 0
        for (const [ id, code ] of table.entries()) {
            if (code[1] !== lead && code[1] !== this._trump[0]) {
                continue
            }
            let score: number
            let inverse: 'H' | 'D' | 'S' | 'C'
            switch (this._trump[0]) {
                case 'H':
                    inverse = 'D'
                    break
                case 'D':
                    inverse = 'H'
                    break
                case 'S':
                    inverse = 'C'
                    break
                case 'C':
                    inverse = 'S'
                    break
            }
            if (code === `J${inverse}`) {
                score = 12
            } else if (code[1] === this._trump[0]) {
                switch (code[0]) {
                    case '9':
                        score = 7
                        break
                    case '0':
                        score = 8
                        break
                    case 'Q':
                        score = 9
                        break
                    case 'K':
                        score = 10
                        break
                    case 'A':
                        score = 11
                        break
                    case 'J':
                        score = 13
                        break
                }
            } else {
                switch (code[0]) {
                    case '9':
                        score = 1
                        break
                    case '0':
                        score = 2
                        break
                    case 'J':
                        score = 3
                        break
                    case 'Q':
                        score = 4
                        break
                    case 'K':
                        score = 5
                        break
                    case 'A':
                        score = 6
                        break
                }
            }
            if (score > leadingScore) {
                leadingScore = score
                leadingPlayer = id
            }
        }
        this._players[leadingPlayer].team.tricks ++
        await this.gameChannel.send({ embeds: [ generateEmbed('info', {
            title: 'Standings',
            fields: [
                {
                    name: 'Team 1:',
                    value: `${this._team1.tricks} tricks`
                },
                {
                    name: 'Team 2',
                    value: `${this._team2.tricks} tricks`
                }
            ]
        }) ] })
        if (this._team1.tricks + this._team2.tricks === 5) {
            return this._score(leader, solo)
        }
        void this._round(leader, solo)
    }

    private _realSuit(card: Card): Suit {
        if (card.code[0] !== 'J') {
            return card.suit
        }
        switch (card.suit) {
            case 'Clubs':
                if (this._trump === 'Spades') {
                    return 'Spades'
                }
                break
            case 'Spades':
                if (this._trump === 'Clubs') {
                    return 'Clubs'
                }
                break
            case 'Hearts':
                if (this._trump === 'Diamonds') {
                    return 'Diamonds'
                }
                break
            case 'Diamonds':
                if (this._trump === 'Hearts') {
                    return 'Hearts'
                }
                break
        }
    }
}