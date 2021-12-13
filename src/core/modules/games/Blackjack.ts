import { ThreadChannel } from 'discord.js'
import { BaseGame } from './util/BaseGame'

export class Blackjack extends BaseGame {

    public constructor(gameChannel: ThreadChannel) {
        super(gameChannel)
    }

}