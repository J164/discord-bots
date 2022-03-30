import { Intents } from 'discord.js';
import { env } from 'node:process';
import { PotatoClient } from './dist/potato-client.js';

void new PotatoClient({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
  partials: ['CHANNEL'],
  presence: {
    activities: [{ name: env.STATUS, type: 'PLAYING' }],
  },
}).login(env.TOKEN);
