import { Client, ClientOptions, Collection, Intents } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { celebrate, deployCommands, getCommands } from '../../core/commonFunctions'
import { config } from '../../core/constants'
import { YeetGuildInputManager } from './YeetGuildInputManager'

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] }
let client = new Client(clientOptions)
let commands: Collection<string, BaseCommand>
const guildStatus = new Map<string, YeetGuildInputManager>()

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
            guildStatus.set(message.guild.id, new YeetGuildInputManager(message.guild, commands))
        }

        guildStatus.get(message.guild.id).parseGenericMessage(message)
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new YeetGuildInputManager(interaction.guild, commands))
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
        case 'celebrate':
            celebrate(client).then(channel => {
                channel.send('https://tenor.com/view/excited-yay-grin-dog-welcome-back-gif-16956636')
                channel.send('YEEEEEEEEEEEEET')
            })
            break
        case 'deploy':
            deployCommands(client, 'yeet')
            break
        default:
            break
    }
})

process.send('ready')