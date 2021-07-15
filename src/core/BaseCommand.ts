import { Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from './BaseGuildInputManager'

export class BaseCommand {

    public readonly aliases: string[]
    public readonly execute: (message: Message, info: BaseGuildInputManager) => Promise<string | MessageEmbed | void> | string | MessageEmbed | void

    public constructor(aliases: string[], execute: (message: Message, info: BaseGuildInputManager) => Promise<string | MessageEmbed | void> | string | MessageEmbed | void) {
        this.aliases = aliases
        this.execute = execute
    }
}