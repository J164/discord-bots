import { ButtonInteraction, Collection, MessageEditOptions, MessageEmbedOptions, MessageSelectOptionData, ThreadChannel, User } from 'discord.js'
import { generateEmbed } from '../../utils/generators.js'

interface MagicPlayer {
    readonly name: string,
    life: number,
    poison: number,
    isAlive: boolean,
    readonly commanderDamage: Map<string, number>
}

export function playMagic(playerList: User[], life: number, gameChannel: ThreadChannel): void {
    const playerData = new Collection<string, MagicPlayer>()
    for (const player of playerList) {
        playerData.set(player.id, {
            name: player.username,
            life: life,
            poison: 0,
            isAlive: true,
            commanderDamage: new Map<string, number>(),
        })
    }

    void listen(playerData, gameChannel)
}

async function listen(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel): Promise<void> {
    const message = await gameChannel.send({ embeds: [ printStandings(playerData) ], components: [ { type: 'ACTION_ROW', components: [ { type: 'BUTTON', label: 'Damage', customId: 'magic-damage', style: 'PRIMARY' }, { type: 'BUTTON', label: 'Heal', customId: 'magic-heal', style: 'SECONDARY' }, { type: 'BUTTON', label: 'End', customId: 'magic-end', style: 'DANGER' } ] } ] })

    gameChannel.createMessageComponentCollector({ filter: b => b.customId.startsWith('magic'), componentType: 'BUTTON', max: 1, time: 300_000 })
        .once('end', async b => {
            if (message.editable) await message.edit({ components: [] })
            if (!b.at(0)) {
                try { void gameChannel.setArchived(true) } catch { /*thread deleted*/ }
                return
            }
            switch(b.at(0).customId) {
                case 'magic-damage':
                    await prompt(playerData, gameChannel, b.at(0))
                    return
                case 'magic-heal':
                    await heal(playerData, gameChannel, b.at(0))
                    return
                case 'magic-end':
                    await b.at(0).update({ embeds: [ printStandings(playerData) ] })
                    try { void gameChannel.setArchived(true) } catch { /*thread deleted*/ }
                    break
            }
        })
}

async function heal(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, interaction: ButtonInteraction): Promise<void> {
    const players: MessageSelectOptionData[] = []
    for (const [ id, player ] of playerData) {
        players.push({ label: player.name, value: id })
    }
    const components: MessageEditOptions['components'] = [ { type: 'ACTION_ROW', components: [ { type: 'SELECT_MENU', customId: 'magic-player_select', options: players } ] }, { type: 'ACTION_ROW', components: [ { type: 'BUTTON', label: '1 Health', customId: 'magic-amount-1', style: 'PRIMARY' }, { type: 'BUTTON', label: '5 Health', customId: 'magic-amount-5', style: 'SECONDARY' }, { type: 'BUTTON', label: '10 Health', customId: 'magic-amount-10', style: 'SECONDARY' } ] } ]
    await interaction.update({ components: components })
    let responses: [ string, number ]
    try {
        responses = await Promise.all([
            new Promise((resolve, reject) => {
                gameChannel.createMessageComponentCollector({ filter: s => s.customId === 'magic-player_select', componentType: 'SELECT_MENU', max: 1, time: 300_000 })
                    .once('end', async s => {
                        if (!s.at(0)) return reject()
                        components.shift()
                        await s.at(0).update({ components: components })
                        resolve(s.at(0).values[0])
                    })
            }),
            new Promise((resolve, reject) => {
                gameChannel.createMessageComponentCollector({ filter: b => b.customId.startsWith('magic-amount'), componentType: 'BUTTON', max: 1, time: 300_000 })
                    .once('end', async b => {
                        if (!b.at(0)) return reject()
                        components.pop()
                        await b.at(0).update({ components: components })
                        resolve(Number.parseInt(b.at(0).customId.split('-')[2]))
                    })
            }),
        ]) as [ string, number ]
    } catch {
        void listen(playerData, gameChannel)
        return
    }

    playerData.get(responses[0]).life += responses[1]
    void listen(playerData, gameChannel)
}

async function prompt(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, interaction: ButtonInteraction): Promise<void> {
    const players: MessageSelectOptionData[] = []
    for (const [ id, player ] of playerData) {
        players.push({ label: player.name, value: id })
    }
    const components: MessageEditOptions['components'] = [ { type: 'ACTION_ROW', components: [ { type: 'SELECT_MENU', customId: 'magic-player_select', options: players } ] }, { type: 'ACTION_ROW', components: [ { type: 'SELECT_MENU', customId: 'magic-modifiers', maxValues: 2, options: [ { label: 'None', value: 'none', description: 'None of the below options' }, { label: 'Poison', value: 'poison', description: 'Whether the damage will apply poison counters' }, { label: 'Commander', value: 'commander', description: 'Whether the damage will apply commander damage' } ] } ] }, { type: 'ACTION_ROW', components: [ { type: 'BUTTON', label: '1 Damage', customId: 'magic-amount-1', style: 'PRIMARY' }, { type: 'BUTTON', label: '5 Damage', customId: 'magic-amount-5', style: 'SECONDARY' }, { type: 'BUTTON', label: '10 Damage', customId: 'magic-amount-10', style: 'SECONDARY' } ] } ]
    await interaction.update({ components: components })
    let responses: [ string[], string[], number ]
    try {
        responses = await Promise.all([
            new Promise((resolve, reject) => {
                gameChannel.createMessageComponentCollector({ filter: s => s.customId === 'magic-player_select', componentType: 'SELECT_MENU', max: 1, time: 300_000 })
                    .once('end', async s => {
                        if (!s.at(0)) return reject()
                        components.shift()
                        await s.at(0).update({ components: components })
                        resolve([ s.at(0).values[0], s.at(0).user.id ])
                    })
            }),
            new Promise((resolve, reject) => {
                gameChannel.createMessageComponentCollector({ filter: s => s.customId === 'magic-modifiers', componentType: 'SELECT_MENU', max: 1, time: 300_000 })
                    .once('end', async s => {
                        if (!s.at(0)) return reject()
                        for (const [ index, component ] of components.entries()) {
                            if ((component.components[0] as { customId: string }).customId === 'magic-modifiers') {
                                components.splice(index, 1)
                                break
                            }
                        }
                        await s.at(0).update({ components: components })
                        resolve(s.at(0).values)
                    })
            }),
            new Promise((resolve, reject) => {
                gameChannel.createMessageComponentCollector({ filter: b => b.customId.startsWith('magic-amount'), componentType: 'BUTTON', max: 1, time: 300_000 })
                    .once('end', async b => {
                        if (!b.at(0)) return reject()
                        components.pop()
                        await b.at(0).update({ components: components })
                        resolve(Number.parseInt(b.at(0).customId.split('-')[2]))
                    })
            }),
        ]) as [ string[], string[], number ]
    } catch {
        void listen(playerData, gameChannel)
        return
    }

    const target = playerData.get(responses[0][0])
    target.life -= responses[2]
    for (const value of responses[1]) {
        if (value === 'poison') {
            target.poison += responses[2]
            continue
        }
        if (value === 'commander') {
            target.commanderDamage.set(responses[0][1], (target.commanderDamage.get(responses[0][1]) ?? 0) + responses[2])
        }
    }

    void checkStatus(playerData, gameChannel, responses[0][0])
}

async function checkStatus(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, player: string): Promise<void> {
    if (playerData.get(player).life < 1 || playerData.get(player).poison >= 10) {
        return endGame(playerData, gameChannel, player)
    }
    for (const [ , commander ] of playerData.get(player).commanderDamage) {
        if (commander >= 21) {
            return endGame(playerData, gameChannel, player)
        }
    }
    void listen(playerData, gameChannel)
}

async function endGame(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, player: string): Promise<void> {
    playerData.get(player).isAlive = false
    if (playerData.filter(user => user.isAlive).size < 2) {
        await gameChannel.send({ embeds: [ generateEmbed('info', { title: `${playerData.filter(player => player.isAlive).first().name} Wins!`, fields: [ { name: `${playerData.filter(player => player.isAlive).first().name}:`, value: `Life Total: ${playerData.filter(player => player.isAlive).first().life}\nPoison Counters: ${playerData.filter(player => player.isAlive).first().poison}` } ] }) ] })
        try { void gameChannel.setArchived(true) } catch { /*thread deleted*/ }
    }
}

function printStandings(playerData: Collection<string, MagicPlayer>): MessageEmbedOptions {
    const embed = generateEmbed('info', { title: 'Current Standings', fields: [] })
    for (const [ , player ] of playerData) {
        let value = 'Commander Damage:\n'
        for (const [ id, damage ] of player.commanderDamage) {
            value += `${playerData.get(id).name}: ${damage}\n`
        }
        embed.fields.push({ name: `${player.name}: ${player.isAlive ? `Life Total: ${player.life}\nPoison Counters: ${player.poison}` : 'ELIMINATED'}`, value: value })
    }
    return embed
}