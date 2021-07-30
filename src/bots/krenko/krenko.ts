import { Client, ClientOptions, Collection, Intents } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { celebrate, deployCommands, getCommands, sysData } from '../../core/common'
import { DatabaseManager } from '../../core/DatabaseManager'

process.on('uncaughtException', err => {
    if (err.message !== 'Unknown interaction') {
        console.log(err)
    }
})

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ] }
let client = new Client(clientOptions)
let commands: Collection<string, BaseCommand>
const database = new DatabaseManager()
const guildStatus = new Map<string, BaseGuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`)
        process.send('start')

        client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)])

        getCommands(client, 'krenko')
            .then(result => { commands = result })

        setInterval(() => {
            client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)])

            getCommands(client, 'krenko')
                .then(result => { commands = result })
        }, 60000)
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new BaseGuildInputManager(interaction.guild, database, commands))
        }

        guildStatus.get(interaction.guild.id).parseCommand(interaction)
            .then(response => {
                if (response) {
                    interaction.editReply(response)
                }
            })
    })
}

process.on('message', function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            guildStatus.clear()
            console.log('Krenko Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Client(clientOptions)
            defineEvents()
            client.login(sysData.krenkoKey)
            break
        case 'celebrate':
            celebrate(client).then(channel => {
                channel.send('https://tenor.com/view/husky-husky-jump-youre-home-welcome-home-excited-gif-15653370')
            })
            break
        case 'deploy':
            deployCommands(client, 'krenko')
            break
        default:
            break
    }
})

process.send('ready')