import { MessageEmbed, Snowflake, User } from 'discord.js'
import { BaseMagicGame } from './BaseMagicGame'

export class CommanderMagicGame extends BaseMagicGame {

    public readonly commanderList: string[]

    public constructor(playerList: User[], commanderList: string[]) {
        super(playerList)
        this.commanderList = commanderList
        for (const [ , player ] of this.playerData) {
            for (const commander of commanderList) {
                player.commanderDamage.set(commander, 0)
            }
        }
    }

    public changeCommanderDamage(player: Snowflake, commander: string, amount: number): MessageEmbed {
        //use select menu to determine commander in command file
        const commanderDamage = this.playerData.get(player).commanderDamage
        commanderDamage.set(commander, commanderDamage.get(commander) + amount)
        return this.checkStatus(player)
    }

    public printStandings(): MessageEmbed {
        const embed = super.printStandings()
        //add commander damage to embed
        return embed
    }

    protected checkStatus(player: Snowflake): MessageEmbed {
        if (this.playerData.get(player).life < 1 || this.playerData.get(player).poison >= 10) {
            return this.eliminate(player)
        }
        for (const [ , number ] of this.playerData.get(player).commanderDamage) {
            if (number > 20) {
                return this.eliminate(player)
            }
        }
        return this.printStandings()
    }
}