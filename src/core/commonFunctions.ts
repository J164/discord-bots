import { ApplicationCommandData, Client, Collection, GuildMember, MessageEmbed, Snowflake, TextChannel, VoiceState } from 'discord.js'
import { createCanvas, loadImage } from 'canvas'
import * as axios from 'axios'
import { readdirSync } from 'fs'
import { BaseCommand } from './BaseCommand'
import { config } from './constants'

export async function getCommands(client: Client, botName: string): Promise<Collection<string, BaseCommand>> {
    const currentCommands = await client.application.commands.fetch()
    const commands = new Collection<string, BaseCommand>()
    for (const [ , command ] of currentCommands) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        commands.set(command.name, <BaseCommand> require(`../bots/${botName}/commands/${command.name}.js`))
    }
    return commands
}

export async function deployCommands(client: Client, botName: string): Promise<void> {
    const commandFiles = readdirSync(`./bots/${botName}/commands`).filter(file => file.endsWith('.js'))
    const commandData: ApplicationCommandData[] = []

    for (const file of commandFiles) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = <BaseCommand> require(`../bots/${botName}/commands/${file}`)
        commandData.push(command.data)
    }

    client.application.commands.set(commandData)
}

export async function celebrate(client: Client): Promise<TextChannel> {
    const guild = await client.guilds.fetch('619975185029922817')
    const channel = <TextChannel> guild.channels.resolve('619975185029922819')
    return channel
}

export function voiceKick(count: number, voiceState: VoiceState): void {
    if (voiceState.channelId) {
        voiceState.disconnect()
        return
    }
    if (count > 5) {
        return
    }
    setTimeout(() => voiceKick(count + 1, voiceState), 2000)
}

export async function searchYoutube(parameter: string): Promise<string> {
    const searchResult = await axios.default.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&order=relevance&q=${encodeURIComponent(parameter)}&type=video&videoDefinition=high&key=${config.googleKey}`)
    if (searchResult.data.pageInfo.totalResults < 1) {
        return null
    }
    return searchResult.data.items[0].id.videoId
}

export async function mergeImages(filePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
    const activeCanvas = createCanvas(options.width, options.height)
    const ctx = activeCanvas.getContext('2d')
    for (const [ i, path ] of filePaths.entries()) {
        const image = await loadImage(path)
        ctx.drawImage(image, i * (options.width / filePaths.length), 0)
    }
    return activeCanvas.toBuffer()
}

export function genericEmbedResponse(title: string): MessageEmbed {
    const embedVar = new MessageEmbed()
    embedVar.setTitle(title)
    embedVar.setColor(0x0099ff)
    return embedVar
}

export async function makeGetRequest(path: string): Promise<unknown> {
    const response = await axios.default.get(path)
    return response.data
}

export async function getUser(guildID: Snowflake, userID: Snowflake, client: Client): Promise<GuildMember> {
    const guild = await client.guilds.fetch(guildID)
    return guild.members.fetch({ user: userID })
}