import { Client, Guild, GuildMember, Message, MessageEmbed, Snowflake, VoiceState } from "discord.js"
import { createCanvas, loadImage } from "canvas"
import * as axios from "axios"
import { readFileSync } from "fs"

export const home = 'D:/Bot Resources'
export const root = './..'
export const sysData = JSON.parse(readFileSync(`${root}/assets/static/static.json`, { encoding: 'utf8' }))
export let userData = JSON.parse(readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }))

export abstract class BaseGuildCommandManager {

    protected readonly guild: Guild
    protected readonly client: Client
    protected readonly users: Map<string, GuildMember>

    public constructor(guild: Guild, client: Client) {
        this.guild = guild
        this.client = client
        this.users = new Map<string, GuildMember>()
    }

    public parseInput(message: Message): Promise<MessageEmbed | string | void> {
        return null
    }

    protected async getUsers(): Promise<void> {
        this.users.set('admin', await this.guild.members.fetch({ user: '609826125501169723' }))
        if (this.guild.id == '619975185029922817' || this.guild.id == '793330937035096134') {
            this.users.set('swear', await this.guild.members.fetch({ user: '633046187506794527' }))
        }
    } 
}

export function voiceKick(count: number, voiceState: VoiceState): void {
    if (voiceState.channelID) {
        voiceState.kick()
        return
    }
    if (count > 5) {
        return
    }
    setTimeout(() => voiceKick(count + 1, voiceState), 2000)
}

export async function searchYoutube(parameter: string): Promise<string> {
    const searchResult = await axios.default.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&order=relevance&q=${encodeURIComponent(parameter)}&type=video&videoDefinition=high&key=${sysData.googleKey}`)
    if (searchResult.data.pageInfo.totalResults < 1) {
        return null
    }
    return searchResult.data.items[0].id.videoId
}

export async function mergeImages(filePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
    const activeCanvas = createCanvas(options.width, options.height)
    const ctx = activeCanvas.getContext('2d')
    for (const [i, path] of filePaths.entries()) {
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

export async function makeGetRequest(path: string): Promise<any> {
    const response = await axios.default.get(path)
    return response.data
}

export async function getUser(guildID: Snowflake, userID: Snowflake, client: Client): Promise<GuildMember> {
    const guild = await client.guilds.fetch(guildID)
    return guild.members.fetch({ user: userID })
}

export function refreshData() {
    userData = JSON.parse(readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }))
}

export function findKey(object: any, property: string): any {
    let result
    if (object instanceof Array) {
        for (const item of object) {
            result = findKey(item, property)
            break
        }
        return result
    }
    for (const prop in object) {
        if (prop === property) {
            return object
        }
        if (object[prop] instanceof Object || object[prop] instanceof Array) {
            result = findKey(object[prop], property)
            return result
        }
    }
}