import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { makeGetRequest, sysData } from '../../../core/common'

interface tenorResponse {
    results: {
        itemurl: string
    }[]
}

const data: ApplicationCommandData = {
    name: 'gif',
    description: 'Get a gif related to YEET'
}

async function gif(): Promise<InteractionReplyOptions> {
    const gifs = <tenorResponse> await makeGetRequest(`https://g.tenor.com/v1/search?q=yeet&key=${sysData.tenorKey}&limit=50&contentfilter=medium`)
    return { content: gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl }
}

module.exports = new BaseCommand(data, gif)