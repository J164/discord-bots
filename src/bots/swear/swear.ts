import { Client, ClientOptions, Collection, Intents } from 'discord.js'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../core/BaseCommand'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { config } from '../../core/utils/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { swearMessageParse } from '../../core/utils/responseFunctions'
import { VoiceManager } from '../../core/voice/VoiceManager'

process.on('SIGKILL', () => {
    process.exit()
})

process.on('unhandledRejection', (error: Error) => {
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-swear.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES ] }
let client: Client = new Client(clientOptions)
let commands: Collection<string, BaseCommand>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()

function defineEvents() {
    client.on('ready', async () => {
        commands = await getCommands(client, 'swear')

        client.user.setActivity(config.swearStatus[Math.floor(Math.random() * config.swearStatus.length)])

        setInterval(async () => {
            commands = await getCommands(client, 'swear')

            client.user.setActivity(config.swearStatus[Math.floor(Math.random() * config.swearStatus.length)])

            for (const [ , guildManager ] of guildStatus) {
                guildManager.voiceManager.checkIsIdle()
            }
        }, 60000)

        console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
        process.send('start')
    })

    client.on('messageCreate', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new GuildInputManager(message.guild, commands, { parseMessage: swearMessageParse, database: database, voiceManager: new VoiceManager() }))
        }

        guildStatus.get(message.guild.id).parseMessage(message)
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new GuildInputManager(interaction.guild, commands, { parseMessage: swearMessageParse, database: database, voiceManager: new VoiceManager() }))
        }

        guildStatus.get(interaction.guild.id).parseCommand(interaction)
            .then(response => {
                if (response) {
                    interaction.editReply(response)
                }
            })
    })
}

process.on('message', arg => {
    switch (arg) {
        case 'stop':
            client.destroy()
            guildStatus.clear()
            console.log('Swear Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Client(clientOptions)
            defineEvents()
            client.login(config.swearKey)
            break
        case 'deploy':
            deployCommands(client, 'swear')
            break
        default:
            break
    }
})

process.send('ready')