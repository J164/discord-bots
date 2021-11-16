import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

interface TenorResponse {
    readonly results: readonly {
        readonly itemurl: string
    }[]
}

const data: ApplicationCommandData = {
    name: 'gif',
    description: 'Get a gif related to YEET'
}

async function gif(): Promise<InteractionReplyOptions> {
    const gifs = <TenorResponse> await (await request(`https://g.tenor.com/v1/search?q=yeet&key=${process.env.tenorKey}&limit=50&contentfilter=medium`)).body.json()
    return { content: gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl }
}

module.exports = { data: data, execute: gif }