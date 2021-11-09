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

export function genericEmbed(options: MessageEmbedOptions): MessageEmbed {
    options.color ??= 0x0099ff
    return new MessageEmbed(options)
}