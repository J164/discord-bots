import { Intents } from 'discord.js'
import { DatabaseManager } from './core/database-manager.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'

void new BotClient(
    { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ],
        partials: [ 'CHANNEL' ],
    },
    {
        name: 'swear',
        status: [ 'Reading the Swear Dictionary', 'Singing Swears', 'Arresting people who don\'t swear', 'Inventing new swears' ],
        guildOptions: {
            voiceManager: true,
        },
    },
    new DatabaseManager(),
).login(process.env.SWEARTOKEN)
