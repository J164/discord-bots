import { Client, ClientOptions, Collection, Intents } from 'discord.js'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../core/BaseCommand'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { config } from '../../core/utils/constants'
import { GuildInputManager } from '../../core/GuildInputManager'
import { yeetMessageParse } from '../../core/utils/responseFunctions'

process.on('SIGKILL', () => {
    process.exit()
})

process.on('unhandledRejection', (error: Error) => {
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-yeet.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] }
let client = new Client(clientOptions)
let commands: Collection<string, BaseCommand>
const guildStatus = new Map<string, GuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log('We have logged in as ' + client.user.tag)
        process.send('start')

        getCommands(client, 'yeet')
            .then(result => { commands = result })

        client.user.setActivity(config.yeetStatus[Math.floor(Math.random() * config.yeetStatus.length)])
        setInterval(() => {
            getCommands(client, 'yeet')
                .then(result => { commands = result })

            client.user.setActivity(config.yeetStatus[Math.floor(Math.random() * config.yeetStatus.length)])
        }, 60000)
    })

    client.on('messageCreate', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new GuildInputManager(message.guild, commands, { parseMessage: yeetMessageParse }))
        }

        guildStatus.get(message.guild.id).parseMessage(message)
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new GuildInputManager(interaction.guild, commands, { parseMessage: yeetMessageParse }))
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
            console.log('Yeet Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Client(clientOptions)
            defineEvents()
            client.login(config.yeetKey)
            break
        case 'deploy':
            deployCommands(client, 'yeet')
            break
        default:
            break
    }
})

process.send('ready')