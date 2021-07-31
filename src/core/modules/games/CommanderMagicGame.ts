import { Snowflake, User } from 'discord.js'
import { makeGetRequest } from '../../commonFunctions'
import { Commander } from '../../interfaces'
import { BaseMagicGame } from './BaseMagicGame'

export class CommanderMagicGame extends BaseMagicGame {

    private readonly commanders: Map<Snowflake, Commander[]>

    public constructor(playerList: User[], commanderList: Map<Snowflake, string[]>) {
        super(playerList)
        for (const [ id, names ] of commanderList) {
            for (const name of names) {
                //<ScryfallResponse> makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`)
            }
        }
    }

}