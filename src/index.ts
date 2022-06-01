import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import config from './config.json' assert { type: 'json' };
import { PotatoClient } from './potato-client.js';

void new PotatoClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel],
  presence: {
    activities: [
      {
        name: config.STATUS,
        type: ActivityType.Playing,
      },
    ],
  },
}).login(config.TOKEN);
