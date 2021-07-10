import { Client, GuildMember, MessageEmbed, Snowflake, VoiceState } from 'discord.js'
import { createCanvas, loadImage } from 'canvas'
import * as axios from 'axios'
import { readFileSync } from 'fs'

export const home = 'D:/Bot Resources'
export const root = './..'
export const sysData = JSON.parse(readFileSync(`${root}/assets/static/static.json`, { encoding: 'utf8' }))
export let userData = JSON.parse(readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }))

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function makeGetRequest(path: string): Promise<any> {
    const response = await axios.default.get(path)
    return response.data
}

export async function getUser(guildID: Snowflake, userID: Snowflake, client: Client): Promise<GuildMember> {
    const guild = await client.guilds.fetch(guildID)
    return guild.members.fetch({ user: userID })
}

export function refreshData(): void {
    userData = JSON.parse(readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }))
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function findKey(object: any, property: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
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