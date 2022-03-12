import { MessageSelectOptionData, ThreadChannel, User } from 'discord.js'
import { generateEmbed } from '../../utils/generators.js'
import { multicardMessage } from '../../utils/card-utils.js'
import { Card, Deck, Suit } from '../../utils/deck.js'
import { setTimeout } from 'node:timers'

interface GameInfo {
    readonly team1: EuchreTeam,
    readonly team2: EuchreTeam,
    readonly players: EuchrePlayer[],
    gameChannel: ThreadChannel,
    trump?: Suit
}

interface EuchreTeam {
    tricks: number;
    score: number;
    readonly name: 'Team 1' | 'Team 2'
}

interface EuchrePlayer {
    readonly hand: Card[]
    readonly team: EuchreTeam
    readonly user: User
    out: boolean
}

export function playEuchre(playerlist: User[], gameChannel: ThreadChannel): void {
    const team1: EuchreTeam = { tricks: 0, score: 0, name: 'Team 1' }
    const team2: EuchreTeam = { tricks: 0, score: 0, name: 'Team 2' }
    void startRound({
        team1: team1,
        team2: team2,
        players: [ { team: team1, user: playerlist[0], hand: [], out: false }, { team: team2, user: playerlist[1], hand: [], out: false }, { team: team1, user: playerlist[2], hand: [], out: false }, { team: team2, user: playerlist[3], hand: [], out: false } ],
        gameChannel: gameChannel,
    })
}

async function startRound(gameInfo: GameInfo): Promise<void> {
    await gameInfo.gameChannel.send({
        embeds: [ generateEmbed('info', {
            title: 'Player Order',
            fields: [
                {
                    name: `1. ${gameInfo.players[0].user.username}`,
                    value: gameInfo.players[0].team.name,
                },
                {
                    name: `2. ${gameInfo.players[1].user.username}`,
                    value: gameInfo.players[1].team.name,
                },
                {
                    name: `3. ${gameInfo.players[2].user.username}`,
                    value: gameInfo.players[2].team.name,
                },
                {
                    name: `4. ${gameInfo.players[3].user.username}`,
                    value: gameInfo.players[3].team.name,
                },
            ],
        }) ],
    })
    const draws = Deck.randomCard({ number: 21, noRepeats: true, codes: [ '9S', '9D', '9C', '9H', '0S', '0D', '0C', '0H', 'JS', 'JD', 'JC', 'JH', 'QS', 'QD', 'QC', 'QH', 'KS', 'KD', 'KC', 'KH', 'AS', 'AD', 'AC', 'AH' ] })
    for (const [ index, player ] of gameInfo.players.entries()) {
        for (let r = index; r < 17 + index; r += 4) {
            player.hand.push(draws[r])
        }
    }
    const top = draws[20]
    for (const player of gameInfo.players) {
        const channel = await player.user.createDM()
        const { embed, file } = multicardMessage(player.hand, 'info', { title: 'Your Hand:' }, 'hand')
        await channel.send({ embeds: [ embed ], files: [ file ] })
    }
    const { embed, file } = multicardMessage([ top ], 'info', { title: 'Top of Stack:' }, 'hand')
    await gameInfo.gameChannel.send({ embeds: [ embed ], files: [ file ] })

    const promptThree = async (index: number): Promise<void> => {
        const channel = await gameInfo.players[index].user.createDM()
        await channel.send({ embeds: [ generateEmbed('prompt', { title: 'Would you like to go alone?' }) ], components: [ { components: [ { type: 'BUTTON', customId: 'three-yes', label: 'Yes', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'three-no', label: 'No', style: 'SECONDARY' } ], type: 'ACTION_ROW' } ] })
        channel.createMessageComponentCollector({ filter: b => b.customId.startsWith('three-'), componentType: 'BUTTON', max: 1 })
            .once('end', async interaction => {
                await interaction.at(0).update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [] })
                if (interaction.at(0).customId === 'three-yes') {
                    gameInfo.players.find(player => player.team === gameInfo.players[index].team && !player.user.equals(gameInfo.players[index].user)).out = true
                    return round(gameInfo, index, true)
                }
                void round(gameInfo, index)
            })
    }

    const promptTwo = async (index = 0): Promise<void> => {
        const channel = await gameInfo.players[index].user.createDM()
        const { embed, file } = multicardMessage(gameInfo.players[index].hand, 'prompt', { title: 'Would you like to pass or select trump?' }, 'hand')
        if (index === 3) {
            embed.title = 'Please select trump'
            await channel.send({ embeds: [ embed ], files: [ file ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'two-select', placeholder: 'Select a Suit', options: [ { label: 'Spades', value: 'Spades', emoji: '\u2660\uFE0F' }, { label: 'Clubs', value: 'Clubs', emoji: '\u2663\uFE0F' }, { label: 'Hearts', value: 'Hearts', emoji: '\u2665\uFE0F' }, { label: 'Diamonds', value: 'Diamonds', emoji: '\u2666\uFE0F' } ] } ], type: 'ACTION_ROW' } ] })
        } else {
            await channel.send({ embeds: [ embed ], files: [ file ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'two-select', placeholder: 'Select a Suit', options: [ { label: 'Spades', value: 'Spades', emoji: '\u2660\uFE0F' }, { label: 'Clubs', value: 'Clubs', emoji: '\u2663\uFE0F' }, { label: 'Hearts', value: 'Hearts', emoji: '\u2665\uFE0F' }, { label: 'Diamonds', value: 'Diamonds', emoji: '\u2666\uFE0F' } ] } ], type: 'ACTION_ROW' }, { components: [ { type: 'BUTTON', customId: 'two-pass', label: 'Pass', style: 'SECONDARY' } ], type: 'ACTION_ROW' } ] })
        }
        channel.createMessageComponentCollector({ filter: b => b.customId.startsWith('two-'), max: 1 })
            .once('end', async interaction => {
                await interaction.at(0).update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                if (interaction.at(0).isSelectMenu()) {
                    gameInfo.trump = top.suit
                    void promptThree(index)
                    return
                }
                return promptTwo(index + 1)
            })
    }

    const promptReplace = async (index: number): Promise<void> => {
        const options: MessageSelectOptionData[] = []
        for (const [ id, card ] of gameInfo.players[3].hand.entries()) {
            options.push({ label: `${card.name} of ${card.suit}`, value: id.toString() })
        }
        const channel = await gameInfo.players[3].user.createDM()
        const { embed, file } = multicardMessage(gameInfo.players[3].hand, 'prompt', { title: 'Select a card to replace' }, 'hand')
        await channel.send({ embeds: [ embed ], files: [ file ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'replace', placeholder: 'Select a Card', options: options } ], type: 'ACTION_ROW' } ] })
        channel.createMessageComponentCollector({ filter: b => b.customId === 'replace', componentType: 'SELECT_MENU', max: 1 })
            .once('end', async interaction => {
                await interaction.at(0).update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
                gameInfo.players[3].hand.splice(Number.parseInt(interaction.at(0).values[0]), 1, top)
                gameInfo.trump = top.suit
                void promptThree(index)
            })
    }

    const promptOne = async (index = 0): Promise<void> => {
        const channel = await gameInfo.players[index].user.createDM()
        await channel.send({ embeds: [ generateEmbed('prompt', { title: index === 3 ? `Would you like to pass or pick it up?` : `Would you like to pass or have ${gameInfo.players[3].user.username} pick it up?`, image: { url: top.image } }) ], components: [ { components: [ { type: 'BUTTON', customId: 'one-pickup', label: 'Pick It Up', style: 'PRIMARY' }, { type: 'BUTTON', customId: 'one-pass', label: 'Pass', style: 'SECONDARY' } ], type: 'ACTION_ROW' } ] })
        channel.createMessageComponentCollector({ filter: b => b.customId.startsWith('one-'), componentType: 'BUTTON', max: 1 })
            .once('end', async interaction => {
                await interaction.at(0).update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [] })
                if (interaction.at(0).customId === 'one-pass') {
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

async function round(gameInfo: GameInfo, leader: number, solo = false, table: string[] = [], lead?: 'H' | 'D' | 'S' | 'C', index = 0): Promise<void> {
    if (gameInfo.players[index].out) {
        if (index === 3) {
            return
        }
        return round(gameInfo, leader, solo, table, lead, index + 1)
    }
    const legalPlays: MessageSelectOptionData[] = []
    for (const card of gameInfo.players[index].hand) {
        if (!lead || lead === realSuit(gameInfo.trump, card)[0]) {
            legalPlays.push({ label: `${card.name} of ${card.suit}`, value: card.code })
        }
    }
    if (legalPlays.length === 0) {
        for (const card of gameInfo.players[index].hand) {
            legalPlays.push({ label: `${card.name} of ${card.suit}`, value: card.code })
        }
    }
    const channel = await gameInfo.players[index].user.createDM()
    const { embed, file } = multicardMessage(gameInfo.players[index].hand, 'prompt', { title: 'Select a card to play' }, 'hand')
    await channel.send({ embeds: [ embed ], files: [ file ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'play', placeholder: 'Select a Card', options: legalPlays } ], type: 'ACTION_ROW' } ] })
    channel.createMessageComponentCollector({ filter: b => b.customId.startsWith('play'), componentType: 'SELECT_MENU', max: 1 })
        .once('end', async interaction => {
            await interaction.at(0).update({ embeds: [ generateEmbed('success', { title: 'Success!' }) ], components: [], files: [] })
            table.push(interaction.at(0).values[0])
            lead ??= interaction.at(0).values[0][1] as 'H' | 'D' | 'S' | 'C'
            gameInfo.players[index].hand.splice(gameInfo.players[index].hand.findIndex(c => c.code === interaction.at(0).values[0]), 1)
            if (index === 3) {
                return determineTrick(gameInfo, table, lead, leader, solo)
            }
            return round(gameInfo, leader, solo, table, lead, index + 1)
        })
}

async function score(gameInfo: GameInfo, leader: number, solo: boolean): Promise<void> {
    const winningTeam = gameInfo.team1.tricks > gameInfo.team2.tricks ? gameInfo.team1 : gameInfo.team2
    if (winningTeam !== gameInfo.players[leader].team) {
        winningTeam.score += 2
    } else if (winningTeam.tricks === 5) {
        winningTeam.score += solo ? 4 : 2
    } else {
        winningTeam.score++
    }
    if (winningTeam.score >= 10) {
        return finish(gameInfo, winningTeam)
    }
    await gameInfo.gameChannel.send({
        embeds: [ generateEmbed('info', {
            title: 'Standings',
            fields: [
                {
                    name: 'Team 1',
                    value: `${gameInfo.team1.score} points`,
                },
                {
                    name: 'Team 2',
                    value: `${gameInfo.team2.score} points`,
                },
            ],
        }) ],
    })
    gameInfo.players.unshift(gameInfo.players.pop())
    for (const player of gameInfo.players) {
        player.out = false
    }
    void startRound(gameInfo)
}

async function finish(gameInfo: GameInfo, winningTeam: EuchreTeam): Promise<void> {
    const embed = generateEmbed('info', {
        title: `${winningTeam.name} Wins!`,
        fields: [
            {
                name: 'Team 1',
                value: `${gameInfo.team1.score} points`,
            },
            {
                name: 'Team 2',
                value: `${gameInfo.team2.score} points`,
            },
        ],
    })
    await gameInfo.gameChannel.send({ embeds: [ embed ] })
    setTimeout(() => { try { void gameInfo.gameChannel.setArchived(true) } catch { /*thread deleted*/ } }, 10_000)
}

// eslint-disable-next-line complexity
async function determineTrick(gameInfo: GameInfo, table: string[], lead: 'H' | 'D' | 'S' | 'C', leader: number, solo: boolean): Promise<void> {
    let leadingPlayer: number
    let leadingScore = 0
    for (const [ id, code ] of table.entries()) {
        if (code[1] !== lead && code[1] !== gameInfo.trump[0]) {
            continue
        }
        let score: number
        let inverse: 'H' | 'D' | 'S' | 'C'
        switch (gameInfo.trump[0]) {
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
        } else if (code[1] === gameInfo.trump[0]) {
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
    gameInfo.players[leadingPlayer].team.tricks++
    await gameInfo.gameChannel.send({
        embeds: [ generateEmbed('info', {
            title: 'Standings',
            fields: [
                {
                    name: 'Team 1:',
                    value: `${gameInfo.team1.tricks} tricks`,
                },
                {
                    name: 'Team 2',
                    value: `${gameInfo.team2.tricks} tricks`,
                },
            ],
        }) ],
    })
    if (gameInfo.team1.tricks + gameInfo.team2.tricks === 5) {
        return score(gameInfo, leader, solo)
    }
    void round(gameInfo, leader, solo)
}

function realSuit(trump: Suit, card: Card): Suit {
    if (card.code[0] !== 'J') {
        return card.suit
    }
    switch (card.suit) {
        case 'Clubs':
            if (trump === 'Spades') {
                return 'Spades'
            }
            break
        case 'Spades':
            if (trump === 'Clubs') {
                return 'Clubs'
            }
            break
        case 'Hearts':
            if (trump === 'Diamonds') {
                return 'Diamonds'
            }
            break
        case 'Diamonds':
            if (trump === 'Hearts') {
                return 'Hearts'
            }
            break
    }
}