import { ThreadChannel } from 'discord.js'
import { BaseGame } from '../../utils/BaseGame.js'

export class Blackjack extends BaseGame {

    public constructor(gameChannel: ThreadChannel) {
        super(gameChannel)
    }

}