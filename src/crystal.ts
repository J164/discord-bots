import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import config from './config.json' assert { type: 'json' };
import { BotClient } from './bot-client.js';

void new BotClient(
  {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    partials: [Partials.Channel],
    presence: {
      activities: [{ name: config.CRYSTALSTATUS, type: ActivityType.Playing }],
    },
  },
  'crystal',
).login(config.CRYSTALTOKEN);
