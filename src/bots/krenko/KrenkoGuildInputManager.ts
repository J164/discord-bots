import { Collection, Guild } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { DatabaseManager } from '../../core/DatabaseManager'
import { BaseMagicGame } from '../../core/modules/games/BaseMagicGame'

export class KrenkoGuildInputManager extends BaseGuildInputManager {

    public readonly database: DatabaseManager
    public game: BaseMagicGame

    public constructor(guild: Guild, commands: Collection<string, BaseCommand>, database: DatabaseManager) {
        super(guild, commands)
        this.database = database
    }
}