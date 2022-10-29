import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import config from './config.json' assert { type: 'json' };
import { BotClient } from './bot-client.js';

void new BotClient(
  {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel],
    presence: {
      activities: [{ name: config.YEETSTATUS, type: ActivityType.Playing }],
    },
  },
  'yeet',
)
  .on('messageCreate', (message) => {
    if (!message.guild || message.author.bot) {
      return;
    }

    const input = message.content.toLowerCase();
    if (/(\W|^)yee+t(\W|$)/.test(input)) {
      if (input.slice(input.indexOf('yee') + 1, input.indexOf('yee') + 11) === 'eeeeeeeeee') {
        void message.reply('Wow! Much Yeet!');
        return;
      }
      void message.reply('YEEEEEEEEEET!');
    }
  })
  .login(config.YEETTOKEN);
