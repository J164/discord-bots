import { Collection, MessageEmbedOptions, ThreadChannel, User } from 'discord.js'
import { generateEmbed } from '../../utils/generators.js'
import { BaseGame } from '../../utils/BaseGame.js'

interface MagicPlayer {
    readonly name: string,
    life: number,
    poison: number,
    isAlive: boolean,
    commanderDamage?: Map<string, number>
}

export class MagicGame extends BaseGame {

    protected readonly playerData: Collection<string, MagicPlayer>

    public constructor(playerList: User[], gameChannel: ThreadChannel) {
        super(gameChannel)
        this.playerData = new Collection<string, MagicPlayer>()
        for (const player of playerList) {
            this.playerData.set(player.id, {
                name: player.username,
                life: 20,
                poison: 0,
                isAlive: true
            })
        }
    }

    public changeLife(player: string, amount: number): MessageEmbedOptions {
        this.playerData.get(player).life += amount
        return this.checkStatus(player)
    }

    public changePoison(player: string, amount: number): MessageEmbedOptions {
        this.playerData.get(player).poison += amount
        return this.checkStatus(player)
    }

    public eliminate(player: string): MessageEmbedOptions {
        if (!this.playerData.get(player).isAlive) {
            return generateEmbed('error', { title: `${this.playerData.get(player).name} is already eliminated` })
        }
        this.playerData.get(player).isAlive = false
        if (this.playerData.filter(user => user.isAlive).size < 2) {
            return this.finishGame()
        }
        return this.printStandings()
    }

    public printStandings(): MessageEmbedOptions {
        const embed = generateEmbed('info', { title: 'Current Standings', fields: [] })
        for (const [ , player ] of this.playerData) {
            embed.fields.push({ name: `${player.name}`, value: player.isAlive ? `Life Total: ${player.life}\nPoison Counters: ${player.poison}` : 'ELIMINATED' })
        }
        return embed
    }

    public finishGame(): MessageEmbedOptions {
        this.end()
        const alive = this.playerData.filter(player => player.isAlive)
        if (alive.size > 1) {
            return this.printStandings()
        }
        return generateEmbed('info', { title: `${alive.first().name} Wins!`, fields: [ { name: `${alive.first().name}:`, value: `Life Total: ${alive.first().life}\nPoison Counters: ${alive.first().poison}` } ] })
    }

    public userInGame(player: string): boolean {
        return this.playerData.has(player)
    }

    protected checkStatus(player: string): MessageEmbedOptions {
        if (this.playerData.get(player).life < 1 || this.playerData.get(player).poison >= 10) {
            return this.eliminate(player)
        }
        return this.printStandings()
    }
}