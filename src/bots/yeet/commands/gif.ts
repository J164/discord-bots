import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { makeGetRequest, sysData } from '../../../core/common'

interface tenorResponse {
    results: {
        itemurl: string
    }[]
}

async function gif(message: Message): Promise<void> {
    const gifs = <tenorResponse> await makeGetRequest(`https://g.tenor.com/v1/search?q=yeet&key=${sysData.tenorKey}&limit=50&contentfilter=medium`)
    message.channel.send(gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl)
}

module.exports = new BaseCommand([ 'gif', 'gifs', 'yeet' ], gif)