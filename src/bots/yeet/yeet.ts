import { BitFieldResolvable, Client, IntentsString } from 'discord.js'
import { celebrate, sysData } from '../../core/common'
import { DatabaseManager } from '../../core/DatabaseManager'
import { YeetGuildInputManager } from './YeetGuildInputManager'

const intents: BitFieldResolvable<IntentsString> = [ 'GUILDS', 'GUILD_MESSAGES' ]
let client = new Client({ ws: { intents: intents } })
const database = new DatabaseManager()
const guildStatus = new Map<string, YeetGuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log('We have logged in as ' + client.user.tag)
        process.send('start')
        client.user.setActivity(sysData.yeetStatus[Math.floor(Math.random() * sysData.yeetStatus.length)])
        setInterval(() => {
            client.user.setActivity(sysData.yeetStatus[Math.floor(Math.random() * sysData.yeetStatus.length)])
        }, 60000)
    })

    client.on('message', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new YeetGuildInputManager(message.guild, database))
        }

        guildStatus.get(message.guild.id).parseInput(message)
            .then(response => {
                if (response) {
                    message.reply(response)
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
            client = new Client({ ws: { intents: intents } })
            defineEvents()
            client.login(sysData.yeetKey)
            break
        case 'celebrate':
            celebrate(client).then(channel => {
                channel.send('https://tenor.com/view/excited-yay-grin-dog-welcome-back-gif-16956636')
                channel.send('YEEEEEEEEEEEEET')
            })
            break
        default:
            break
    }
})

process.send('ready')