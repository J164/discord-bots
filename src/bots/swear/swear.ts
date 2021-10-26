import { Client, Intents } from 'discord.js'
import { writeFileSync } from 'fs'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { config, secrets } from '../../core/utils/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { VoiceManager } from '../../core/voice/VoiceManager'
import { Command } from '../../core/utils/interfaces'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-swear.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ] })
let commands: Map<string, Command>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()

client.on('ready', async () => {
    commands = await getCommands(client, 'swear')

    client.user.setActivity(config.swearStatus[Math.floor(Math.random() * config.swearStatus.length)])

    setInterval(async () => {
        client.user.setActivity(config.swearStatus[Math.floor(Math.random() * config.swearStatus.length)])

        for (const [ , guildManager ] of guildStatus) {
            guildManager.statusCheck()
        }
    }, 60000)

    console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
    process.send('start')
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return
    }

    if (!guildStatus.has(interaction.guild.id)) {
        guildStatus.set(interaction.guild.id, new GuildInputManager(commands, { database: database, voiceManager: new VoiceManager() }))
    }

    const response = await guildStatus.get(interaction.guild.id).parseCommand(interaction)
    if (response) {
        interaction.editReply(response)
    }
})

process.on('message', arg => {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log('\x1b[41m', 'Swear Bot has been logged out', '\x1b[0m')
            process.send('stop')
            process.exit()
            break
        case 'start':
            client.login(secrets.swearKey)
            break
        case 'deploy':
            deployCommands(client, 'swear')
            break
        default:
            break
    }
})

process.send('ready')