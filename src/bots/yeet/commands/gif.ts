import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { makeGetRequest } from '../../../core/commonFunctions'
import { config } from '../../../core/constants'
import { TenorResponse } from '../../../core/interfaces'

const data: ApplicationCommandData = {
    name: 'gif',
    description: 'Get a gif related to YEET'
}

async function gif(): Promise<InteractionReplyOptions> {
    const gifs = <TenorResponse> await makeGetRequest(`https://g.tenor.com/v1/search?q=yeet&key=${config.tenorKey}&limit=50&contentfilter=medium`)
    return { content: gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl }
}

module.exports = new BaseCommand(data, gif)