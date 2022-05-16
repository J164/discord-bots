import { InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import process from 'node:process'
import { GlobalChatCommand } from '../../core/utils/interfaces.js'

interface TenorResponse {
    readonly results: readonly {
        readonly itemurl: string
    }[]
}

async function gif(): Promise<InteractionReplyOptions> {
    const gifs = await (await request(`https://g.tenor.com/v1/search?q=yeet&key=${process.env.TENORKEY}&limit=50&contentfilter=medium`)).body.json() as TenorResponse
    return { content: gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl }
}

export const command = new GlobalChatCommand({
    name: 'gif',
    description: 'Get a gif related to YEET',
}, { respond: gif })
