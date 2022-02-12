import { Intents } from 'discord.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'
import { DatabaseManager } from './core/database-manager.js'

void new BotClient(
    {
        intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ],
        partials: [ 'CHANNEL' ],
    },
    {
        name: 'potato',
        status: [ 'Eating a baked potato', 'Farming potatoes', 'Decorating with potatoes', 'Looking up potato recipes', 'Potato Platformer 3000' ],
        guildOptions: {
            queueManager: true,
        },
    },
    new DatabaseManager(),
).login(process.env.POTATOTOKEN)
