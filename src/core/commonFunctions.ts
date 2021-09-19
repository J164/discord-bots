import { ApplicationCommandData, Channel, Client, Collection, GuildMember, MessageEmbed, MessageEmbedOptions, Snowflake, VoiceState } from 'discord.js'
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

export function deployCommands(client: Client, botName: string): void {
    const commandFiles = readdirSync(`./bots/${botName}/commands`).filter(file => file.endsWith('.js'))
    const commandData: ApplicationCommandData[] = []
    for (const file of commandFiles) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = <BaseCommand> require(`../bots/${botName}/commands/${file}`)
        commandData.push(command.data)
    }
    client.application.commands.set(commandData)
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

export function genericEmbed(options: MessageEmbedOptions): MessageEmbed {
    if (!options.color) {
        options.color = 0x0099ff
    }
    return new MessageEmbed(options)
}

export async function makeGetRequest(path: string): Promise<unknown> {
    const response = await axios.default.get(path)
    return response.data
}

export async function getUser(guildID: Snowflake, userID: Snowflake, client: Client): Promise<GuildMember> {
    const guild = await client.guilds.fetch(guildID)
    return guild.members.fetch({ user: userID })
}

export async function getChannel(client: Client, guildId: Snowflake, channelId: Snowflake): Promise<Channel> {
    const guild = await client.guilds.fetch(guildId)
    return guild.channels.fetch(channelId)
}

// eslint-disable-next-line complexity
export function getStringDate(date: Date): string {
    const day = date.getDate()
    const year = date.getFullYear()
    let month: string
    let weekDay: string
    switch (date.getMonth()) {
        case 0:
            month = 'January'
            break
        case 1:
            month = 'February'
            break
        case 2:
            month = 'March'
            break
        case 3:
            month = 'April'
            break
        case 4:
            month = 'May'
            break
        case 5:
            month = 'June'
            break
        case 6:
            month = 'July'
            break
        case 7:
            month = 'August'
            break
        case 8:
            month = 'September'
            break
        case 9:
            month = 'October'
            break
        case 10:
            month = 'November'
            break
        case 11:
            month = 'December'
            break
        default:
            month = 'January'
            break
    }
    switch (date.getDay()) {
        case 0:
            weekDay = 'Sunday'
            break
        case 1:
            weekDay = 'Monday'
            break
        case 2:
            weekDay = 'Tuesday'
            break
        case 3:
            weekDay = 'Wednesday'
            break
        case 4:
            weekDay = 'Thursday'
            break
        case 5:
            weekDay = 'Friday'
            break
        case 6:
            weekDay = 'Saturday'
            break
        default:
            weekDay = 'Sunday'
            break
    }
    return `${weekDay}, ${month} ${day}, ${year}`
}

// eslint-disable-next-line complexity
export function getWeatherEmoji(weatherCode: number): string {
    switch (weatherCode) {
        case 1000:
            return '\u2600'
        case 1003:
            return '\u26C5'
        case 1006:
        case 1009:
            return '\u2601'
        case 1030:
        case 1135:
        case 1147:
            return '\u1F32B'
        case 1063:
        case 1072:
        case 1150:
        case 1153:
        case 1168:
        case 1171:
        case 1180:
        case 1183:
        case 1186:
        case 1189:
        case 1192:
        case 1195:
        case 1198:
        case 1201:
        case 1240:
        case 1243:
        case 1246:
            return '\u1F327'
        case 1066:
        case 1114:
        case 1117:
        case 1210:
        case 1213:
        case 1216:
        case 1219:
        case 1222:
        case 1225:
        case 1255:
        case 1258:
        case 1069:
        case 1204:
        case 1207:
        case 1237:
        case 1249:
        case 1252:
        case 1261:
        case 1264:
            return '\u1F328'
        case 1087:
        case 1273:
        case 1276:
        case 1279:
        case 1282:
            return '\u1F329'
        default:
            return '\u2753'
    }
}