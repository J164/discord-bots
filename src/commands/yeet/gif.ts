import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand } from '../../bot-client.js';
import config from '../../config.json' assert { type: 'json' };

interface TenorResponse {
  readonly results: readonly {
    readonly itemurl: string;
  }[];
}

async function gif(): Promise<InteractionReplyOptions> {
  const gifs = (await (await fetch(`https://g.tenor.com/v1/search?q=yeet&key=${config.TENORKEY}&limit=50&contentfilter=medium`)).json()) as TenorResponse;
  return {
    content: gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl,
  };
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'gif',
    description: 'Get a gif related to YEET',
  },
  respond: gif,
  type: 'Global',
};
