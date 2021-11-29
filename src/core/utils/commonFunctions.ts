import { ApplicationCommandData, Client, MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { readdirSync } from 'fs'
import { Command } from './interfaces'

export async function getCommands(client: Client, botName: string): Promise<Map<string, Command>> {
    const currentCommands = await client.application.commands.fetch()
    const commands = new Map<string, Command>()
    for (const [ , command ] of currentCommands) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            commands.set(command.name, <Command> require(`../../bots/${botName}/commands/${command.name}.js`))
        } catch {
            console.warn(`Registered command missing from command files (${command.name})`)
        }
    }
    return commands
}

export function deployCommands(client: Client, botName: string): void {
    const commandFiles = readdirSync(`./dist/bots/${botName}/commands`).filter(file => file.endsWith('.js'))
    const commandData: ApplicationCommandData[] = []
    for (const file of commandFiles) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = <Command> require(`../../bots/${botName}/commands/${file}`)
        commandData.push(command.data)
    }
    client.application.commands.set(commandData)
}

export function generateEmbed(type: 'info' | 'error' | 'success' | 'prompt', options: MessageEmbedOptions): MessageEmbed {
    switch (type) {
        case 'info':
            options.color ??= 0x0099ff
            options.title = `\uD83D\uDCC4\t${options.title}`
            break
        case 'error':
            options.color ??= 0xff0000
            options.title = `\u274C\t${options.title}`
            break
        case 'success':
            options.color ??= 0x00ff00
            options.title = `\u2705\t${options.title}`
            break
        case 'prompt':
            options.color ??= 0xffa500
            options.title = `\u2753\t${options.title}`
            break
    }
    return new MessageEmbed(options)
}