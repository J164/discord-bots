import { Intents } from 'discord.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'

void new BotClient(
    {
        intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ],
        partials: [ 'CHANNEL' ],
        presence: {
            status: 'dnd',
            activities: [ { name: process.env.POTATOSTATUS, type: 'PLAYING' } ],
        },
    },
    {
        name: 'potato',
        database: true,
        guildOptions: {
            queueManager: true,
        },
    },
).login(process.env.POTATOTOKEN)
