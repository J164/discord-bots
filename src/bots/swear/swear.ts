import { Client, ClientOptions, Collection, Intents } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { deployCommands, getCommands } from '../../core/commonFunctions'
import { config } from '../../core/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { swearMessageParse } from '../../core/responseFunctions'
import { VoiceManager } from '../../core/VoiceManager'

process.on('uncaughtException', err => {
    if (err.message !== 'Unknown interaction') {
        console.log(err)
    }
})

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES ] }
let client: Client = new Client(clientOptions)
let commands: Collection<string, BaseCommand>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log('We have logged in as ' + client.user.tag)
        process.send('start')

        client.user.setActivity(config.swearStatus[Math.floor(Math.random() * config.swearStatus.length)])

        getCommands(client, 'swear')
            .then(result => { commands = result })

        setInterval(() => {
            client.user.setActivity(config.swearStatus[Math.floor(Math.random() * config.swearStatus.length)])

            getCommands(client, 'swear')
                .then(result => { commands = result })

            for (const [ , guildManager ] of guildStatus) {
                guildManager.voiceManager.checkIsIdle()
            }
        }, 60000)
    })

    client.on('messageCreate', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new GuildInputManager(message.guild, commands, swearMessageParse, database, new VoiceManager()))
        }

        guildStatus.get(message.guild.id).parseMessage(message)
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new GuildInputManager(interaction.guild, commands, swearMessageParse, database, new VoiceManager()))
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