import { MessageEmbed, Snowflake, User } from 'discord.js'
import { genericEmbed } from '../../utils/commonFunctions'
import { MagicPlayer } from '../../utils/interfaces'

export class BaseMagicGame {

    protected readonly playerData: Map<Snowflake, MagicPlayer>
    protected numAlive: number
    public isActive: boolean

    public constructor(playerList: User[]) {
        this.isActive = true
        this.numAlive = playerList.length
        this.playerData = new Map<Snowflake, MagicPlayer>()
        for (const player of playerList) {
            this.playerData.set(player.id, {
                name: player.username,
                life: 20,
                poison: 0,
                isAlive: true
            })
        }
    }

    public changeLife(player: Snowflake, amount: number): MessageEmbed {
        this.playerData.get(player).life += amount
        return this.checkStatus(player)
    }

    public changePoison(player: Snowflake, amount: number): MessageEmbed {
        this.playerData.get(player).poison += amount
        return this.checkStatus(player)
    }

    public eliminate(player: Snowflake): MessageEmbed {
        if (!this.playerData.get(player).isAlive) {
            return genericEmbed({ title: `${this.playerData.get(player).name} is already eliminated` })
        }
        this.playerData.get(player).isAlive = false
        this.numAlive--
        if (this.numAlive < 2) {
            return this.finishGame()
        }
        return this.printStandings()
    }

    public printStandings(): MessageEmbed {
        const embed = genericEmbed({ title: 'Current Standings' })
        for (const [ , player ] of this.playerData) {
            if (player.isAlive) {
                embed.addField(`${player.name}:`, `Life Total: ${player.life}\nPoison Counters: ${player.poison}`)
                continue
            }
            embed.addField(`${player.name}:`, 'ELIMINATED')
        }
        return embed
    }

    public finishGame(): MessageEmbed {
        this.isActive = false
        if (this.numAlive > 1) {
            return this.printStandings()
        }
        for (const [ , player ] of this.playerData) {
            if (player.isAlive) {
                return genericEmbed({ title: `${player.name} Wins!` })
                    .addField(`${player.name}:`, `Life Total: ${player.life}\nPoison Counters: ${player.poison}`)
            }
        }
    }

    public userInGame(player: Snowflake): boolean {
        return this.playerData.has(player)
    }

    protected checkStatus(player: Snowflake): MessageEmbed {
        if (this.playerData.get(player).life < 1 || this.playerData.get(player).poison >= 10) {
            return this.eliminate(player)
        }
        return this.printStandings()
    }
}