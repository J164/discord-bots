import { ThreadChannel } from 'discord.js'
import { BaseCardGame } from './Util/BaseCardGame'

export class Blackjack extends BaseCardGame {

    public constructor(gameChannel: ThreadChannel) {
        super(gameChannel)
    }

}