import { Intents } from 'discord.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'

void new BotClient(
    {
        intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ],
        partials: [ 'CHANNEL' ],
    },
    {
        name: 'crystal',
        status: [ 'Karl Needs a Bandage', 'The Agent Game', 'Gangster Town', 'The Running Game', 'The Games (Which one?)' ],
        guildOptions: {
            voiceManager: true,
        },
    },
).login(process.env.CRYSTALTOKEN)
