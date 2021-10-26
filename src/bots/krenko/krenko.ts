import { Client, ClientOptions, Intents } from 'discord.js'
import { writeFileSync } from 'fs'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { config, secrets } from '../../core/utils/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { Command } from '../../core/utils/interfaces'

process.on('SIGKILL', () => {
    process.exit()
})

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-krenko.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS ] }
let client = new Client(clientOptions)
let commands: Map<string, Command>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()

function defineEvents() {
    client.on('ready', async () => {
        commands = await getCommands(client, 'krenko')

        client.user.setActivity(config.krenkoStatus[Math.floor(Math.random() * config.krenkoStatus.length)])

        setInterval(async () => {
            client.user.setActivity(config.krenkoStatus[Math.floor(Math.random() * config.krenkoStatus.length)])
        }, 60000)

        console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
        process.send('start')
    })

    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new GuildInputManager(commands, { database: database }))
        }

        const response = await guildStatus.get(interaction.guild.id).parseCommand(interaction)
        if (response) {
            interaction.editReply(response)
        }
    })
}

process.on('message', function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            for (const [ , guild ] of guildStatus) {
                guild.reset()
            }
            guildStatus.clear()
            console.log('\x1b[41m', 'Krenko Bot has been logged out', '\x1b[0m')
            process.send('stop')
            break
        case 'start':
            client = new Client(clientOptions)
            defineEvents()
            client.login(secrets.krenkoKey)
            break
        case 'deploy':
            deployCommands(client, 'krenko')
            break
        default:
            break
    }
})

process.send('ready')