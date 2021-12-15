import { MessageEmbedOptions, ThreadChannel, User } from 'discord.js'
import { MagicGame } from './MagicGame.js'

export class CommanderMagicGame extends MagicGame {

    // todo finish

    public readonly commanderList: string[]

    public constructor(playerList: User[], commanderList: string[], gameChannel: ThreadChannel) {
        super(playerList, gameChannel)
        this.commanderList = commanderList
        for (const [ , player ] of this.playerData) {
            for (const commander of commanderList) {
                player.commanderDamage.set(commander, 0)
            }
        }
    }

    public changeCommanderDamage(player: string, commander: string, amount: number): MessageEmbedOptions {
        //use select menu to determine commander in command file
        const commanderDamage = this.playerData.get(player).commanderDamage
        commanderDamage.set(commander, commanderDamage.get(commander) + amount)
        return this.checkStatus(player)
    }

    public printStandings(): MessageEmbedOptions {
        const embed = super.printStandings()
        //add commander damage to embed
        return embed
    }

    protected checkStatus(player: string): MessageEmbedOptions {
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