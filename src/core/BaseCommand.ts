/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message } from 'discord.js'
import { BaseGuildInputManager } from './BaseGuildInputManager'

export class BaseCommand {

    public readonly aliases: string[]
    public readonly execute: (message: Message, info: BaseGuildInputManager) => any

    public constructor(aliases: string[], execute: (message: Message, info: BaseGuildInputManager) => any) {
        this.aliases = aliases
        this.execute = execute
    }
}