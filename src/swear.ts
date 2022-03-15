import { Intents } from 'discord.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'

void new BotClient(
    {
        intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ],
        partials: [ 'CHANNEL' ],
        presence: {
            status: 'dnd',
            activities: [ { name: process.env.SWEARSTATUS, type: 'PLAYING' } ],
        },
    },
    {
        name: 'swear',
        database: true,
        guildOptions: {
            voiceManager: true,
        },
    },
).login(process.env.SWEARTOKEN)
