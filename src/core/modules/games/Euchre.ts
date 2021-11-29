import { ButtonInteraction, CollectorFilter, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction, ThreadChannel, User } from 'discord.js'
import { generateEmbed } from '../../utils/commonFunctions'
import { BaseCardGame } from './Util/BaseCardGame'
import { Card, Deck, Suit } from './Util/Deck'

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

export class Euchre extends BaseCardGame {

    private readonly team1: EuchreTeam
    private readonly team2: EuchreTeam
    private trump: Suit
    private readonly players: EuchrePlayer[]

    public constructor(players: User[], gameChannel: ThreadChannel) {
        super(gameChannel)
        this.team1 = { tricks: 0, score: 0, name: 'Team 1' }
        this.team2 = { tricks: 0, score: 0, name: 'Team 2' }
        this.players = [ { team: this.team1, user: players[0], out: false }, { team: this.team2, user: players[1], out: false }, { team: this.team1, user: players[2], out: false }, { team: this.team2, user: players[3], out: false } ]
    }

    public async startRound(): Promise<void> {
        await this.gameChannel.send({ embeds: [ generateEmbed('info', {
            title: 'Player Order',
            fields: [
                {
                    name: `1. ${this.players[0].user.username}`,
                    value: this.players[0].team.name
                },
                {
                    name: `2. ${this.players[1].user.username}`,
                    value: this.players[1].team.name
                },
                {
                    name: `3. ${this.players[2].user.username}`,
                    value: this.players[2].team.name
                },
                {
                    name: `4. ${this.players[3].user.username}`,
                    value: this.players[3].team.name
                }
            ]
        }) ] })
        const deck = new Deck([ '9S', '9D', '9C', '9H', '0S', '0D', '0C', '0H', 'JS', 'JD', 'JC', 'JH', 'QS', 'QD', 'QC', 'QH', 'KS', 'KD', 'KC', 'KH', 'AS', 'AD', 'AC', 'AH' ])
        deck.shuffle()
        const draws = deck.draw(21)
        for (const [ index, player ] of this.players.entries()) {
            player.hand = []
            for (let i = index; i < 17 + index; i += 4) {
                player.hand.push(draws[i])
            }
        }
        const top = draws[20]
        for (const player of this.players) {
            const channel = await player.user.createDM()
            await channel.send(await this.multicardMessage(player.hand, 'info', { title: 'Your Hand:' }))
        }
        this.gameChannel.send(await this.multicardMessage([ top ], 'info', { title: 'Top of Stack:' }))

        const promptThree = async (index: number): Promise<void> => {
            const options = new MessageActionRow({ components: [ new MessageButton({ customId: 'three-yes', label: 'Yes', style: 'PRIMARY' }), new MessageButton({ customId: 'three-no', label: 'No', style: 'SECONDARY' }) ] })
            const channel = await this.players[index].user.createDM()
            await channel.send({ embeds: [ generateEmbed('prompt', { title: 'Would you like to go alone?' }) ], components: [ options ] })
            const filter: CollectorFilter<[ButtonInteraction]> = b => b.customId.startsWith('three-')
            const collector = channel.createMessageComponentCollector({ filter: filter, time: 60000, componentType: 'BUTTON', max: 1 })
            collector.once('collect', interaction => {
                interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [] })
                if (interaction.customId === 'three-yes') {
                    this.players.find(player => player.team === this.players[index].team && !player.user.equals(this.players[index].user)).out = true
                    return this.round(index, true)
                }
                this.round(index)
            })
        }

        const promptTwo = async (index = 0): Promise<void> => {
            const options1 = new MessageActionRow({ components: [ new MessageSelectMenu({ customId: 'two-select', placeholder: 'Select a Suit', options: [ { label: 'Spades', value: 'Spades', emoji: '\u2660\uFE0F' }, { label: 'Clubs', value: 'Clubs', emoji: '\u2663\uFE0F' }, { label: 'Hearts', value: 'Hearts', emoji: '\u2665\uFE0F' }, { label: 'Diamonds', value: 'Diamonds', emoji: '\u2666\uFE0F' } ] }) ] })
            const options2 = new MessageActionRow({ components: [ new MessageButton({ customId: 'two-pass', label: 'Pass', style: 'SECONDARY' }) ] })
            const channel = await this.players[index].user.createDM()
            const { embeds, files } = await this.multicardMessage(this.players[index].hand, 'prompt', { title: 'Would you like to pass or select trump?' })
            if (index === 3) {
                embeds[0].title = 'Please select trump'
                await channel.send({ embeds: embeds, files: files, components: [ options2 ] })
            } else {
                await channel.send({ embeds: embeds, files: files, components: [ options1, options2 ] })
            }
            const filter: CollectorFilter<[ButtonInteraction | SelectMenuInteraction]> = b => b.customId.startsWith('two-')
            const collector1 = channel.createMessageComponentCollector({ filter: filter, time: 60000, componentType: 'SELECT_MENU', max: 1 })
            const collector2 = channel.createMessageComponentCollector({ filter: filter, time: 60000, componentType: 'BUTTON', max: 1 })
            collector1.once('collect', interaction => {
                collector2.stop()
                collector2.removeAllListeners()
                interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                this.trump = top.suit
                promptThree(index)
            })
            collector2.once('collect', interaction => {
                collector1.stop()
                collector1.removeAllListeners()
                interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                return promptTwo(index + 1)
            })
        }

        const promptReplace = async (index: number): Promise<void> => {
            const opts: MessageSelectOptionData[] = []
            for (const[ id, card ] of this.players[3].hand.entries()) {
                opts.push({ label: `${card.value} of ${card.suit}`, value: id.toString() })
            }
            const options = new MessageActionRow({ components: [ new MessageSelectMenu({ customId: 'replace', placeholder: 'Select a Card', options: opts }) ] })
            const channel = await this.players[3].user.createDM()
            const { embeds, files } = await this.multicardMessage(this.players[3].hand, 'prompt', { title: 'Select a card to replace' })
            await channel.send({ embeds: embeds, files: files, components: [ options ] })
            const filter: CollectorFilter<[SelectMenuInteraction]> = b => b.customId === 'replace'
            const collector = channel.createMessageComponentCollector({ filter: filter, time: 60000, componentType: 'SELECT_MENU', max: 1 })
            collector.once('collect', interaction => {
                interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                this.players[3].hand.splice(new Number(interaction.values[0]).valueOf(), 1, top)
                this.trump = top.suit
                promptThree(index)
            })
        }

        const promptOne = async (index = 0): Promise<void> => {
            const options = new MessageActionRow({ components: [ new MessageButton({ customId: 'one-pickup', label: 'Pick It Up', style: 'PRIMARY' }), new MessageButton({ customId: 'one-pass', label: 'Pass', style: 'SECONDARY' }) ] })
            const channel = await this.players[index].user.createDM()
            if (index === 3) {
                await channel.send({ embeds: [ generateEmbed('prompt', { title: `Would you like to pass or pick it up?`, image: { url: top.image } }) ], components: [ options ] })
            } else {
                await channel.send({ embeds: [ generateEmbed('prompt', { title: `Would you like to pass or have ${this.players[3].user.username} pick it up?`, image: { url: top.image } }) ], components: [ options ] })
            }
            const filter: CollectorFilter<[ButtonInteraction]> = b => b.customId.startsWith('one-')
            const collector = channel.createMessageComponentCollector({ filter: filter, time: 60000, componentType: 'BUTTON', max: 1 })
            collector.once('collect', interaction => {
                interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [] })
                if (interaction.customId === 'one-pass') {
                    if (index === 3) {
                        return promptTwo()
                    }
                    return promptOne(index + 1)
                }
                promptReplace(index)
            })
        }

       promptOne()
    }

    private async round(leader: number, solo = false, table: string[] = [], lead: 'H' | 'D' | 'S' | 'C' = null, index = 0): Promise<void> {
        if (this.players[index].out) {
            if (index === 3) {
                return
            }
            return this.round(leader, solo, table, lead, index + 1)
        }
        const legalPlays: MessageSelectOptionData[] = []
        for (const card of this.players[index].hand) {
            if (!lead || lead === this.realSuit(card)[0]) {
                legalPlays.push({ label: `${card.value} of ${card.suit}`, value: card.code })
            }
        }
        if (legalPlays.length === 0) {
            for (const card of this.players[index].hand) {
                legalPlays.push({ label: `${card.value} of ${card.suit}`, value: card.code })
            }
        }
        const options = new MessageActionRow({ components: [ new MessageSelectMenu({ customId: 'play', placeholder: 'Select a Card', options: legalPlays }) ] })
        const channel = await this.players[index].user.createDM()
        const { embeds, files } = await this.multicardMessage(this.players[index].hand, 'prompt', { title: 'Select a card to play' })
        await channel.send({ embeds: embeds, files: files, components: [ options ] })
        const filter: CollectorFilter<[SelectMenuInteraction]> = b => b.customId.startsWith('play')
        const collector = channel.createMessageComponentCollector({ filter: filter, time: 60000, componentType: 'SELECT_MENU', max: 1 })
        collector.once('collect', interaction => {
            interaction.update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
            table.push(interaction.values[0])
            lead ??= <'H' | 'D' | 'S' | 'C'>interaction.values[0][1]
            this.players[index].hand.splice(this.players[index].hand.findIndex(c => c.code === interaction.values[0]), 1)
            if (index === 3) {
                return this.determineTrick(table, lead, leader, solo)
            }
            return this.round(leader, solo, table, lead, index + 1)
        })
    }

    private async score(leader: number, solo: boolean): Promise<void> {
        let winningTeam: EuchreTeam
        if (this.team1.tricks > this.team2.tricks) {
            winningTeam = this.team1
        } else {
            winningTeam = this.team2
        }
        if (winningTeam !== this.players[leader].team) {
            winningTeam.score += 2
        } else if (winningTeam.tricks === 5) {
            if (solo) {
                winningTeam.score += 4
            } else {
                winningTeam.score += 2
            }
        } else {
            winningTeam.score ++
        }
        if (winningTeam.score >= 10) {
            return this.finish(winningTeam)
        }
        await this.gameChannel.send({ embeds: [ generateEmbed('info', {
            title: 'Standings',
            fields: [
                {
                    name: 'Team 1',
                    value: `${this.team1.score} points`
                },
                {
                    name: 'Team 2',
                    value: `${this.team2.score} points`
                }
            ]
        }) ] })
        this.players.unshift(this.players.pop())
        for (const player of this.players) {
            player.out = false
        }
        this.startRound()
    }

    private async finish(winningTeam: EuchreTeam): Promise<void> {
        const embed = generateEmbed('info', {
            title: `${winningTeam.name} Wins!`,
            fields: [
                {
                    name: 'Team 1',
                    value: `${this.team1.score} points`
                },
                {
                    name: 'Team 2',
                    value: `${this.team2.score} points`
                }
            ]
        })
        await this.gameChannel.send({ embeds: [ embed ] })
        this.end()
    }

    // eslint-disable-next-line complexity
    private async determineTrick(table: string[], lead: 'H' | 'D' | 'S' | 'C', leader: number, solo: boolean): Promise<void> {
        let leadingPlayer: number
        let leadingScore = 0
        for (const [ id, code ] of table.entries()) {
            if (code[1] !== lead && code[1] !== this.trump[0]) {
                continue
            }
            let score: number
            let inverse: 'H' | 'D' | 'S' | 'C'
            switch (this.trump[0]) {
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
            } else if (code[1] === this.trump[0]) {
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
        this.players[leadingPlayer].team.tricks ++
        await this.gameChannel.send({ embeds: [ generateEmbed('info', {
            title: 'Standings',
            fields: [
                {
                    name: 'Team 1:',
                    value: `${this.team1.tricks} tricks`
                },
                {
                    name: 'Team 2',
                    value: `${this.team2.tricks} tricks`
                }
            ]
        }) ] })
        if (this.team1.tricks + this.team2.tricks === 5) {
            return this.score(leader, solo)
        }
        this.round(leader, solo)
    }

    private realSuit(card: Card): Suit {
        if (card.code[0] !== 'J') {
            return card.suit
        }
        switch (card.suit) {
            case 'Clubs':
                if (this.trump === 'Spades') {
                    return 'Spades'
                }
                break
            case 'Spades':
                if (this.trump === 'Clubs') {
                    return 'Clubs'
                }
                break
            case 'Hearts':
                if (this.trump === 'Diamonds') {
                    return 'Diamonds'
                }
                break
            case 'Diamonds':
                if (this.trump === 'Hearts') {
                    return 'Hearts'
                }
                break
        }
    }
}