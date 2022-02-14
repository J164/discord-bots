import { Intents } from 'discord.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'

void new BotClient(
    {
        intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ],
        partials: [ 'CHANNEL' ],
    },
    {
        name: 'potato',
        status: [ 'Eating a baked potato', 'Farming potatoes', 'Decorating with potatoes', 'Looking up potato recipes', 'Potato Platformer 3000' ],
        database: true,
        guildOptions: {
            queueManager: true,
        },
    },
).login(process.env.POTATOTOKEN)
