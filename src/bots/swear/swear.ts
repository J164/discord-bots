import { BitFieldResolvable, Client, IntentsString } from 'discord.js'
import { celebrate, sysData } from '../../core/common'
import { DatabaseManager } from '../../core/DatabaseManager'
import { SwearGuildInputManager } from './SwearGuildInputManager'

const intents: BitFieldResolvable<IntentsString> = [ 'GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES' ]
let client: Client = new Client({ ws: { intents: intents } })
const database = new DatabaseManager()
const guildStatus = new Map<string, SwearGuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log('We have logged in as ' + client.user.tag)
        process.send('start')
        client.user.setActivity(sysData.swearStatus[Math.floor(Math.random() * sysData.swearStatus.length)])
        setInterval(() => {
            client.user.setActivity(sysData.swearStatus[Math.floor(Math.random() * sysData.swearStatus.length)])
            for (const [ , guildManager ] of guildStatus) {
                guildManager.voiceManager.checkIsIdle()
            }
        }, 60000)
    })

    client.on('message', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new SwearGuildInputManager(message.guild, database))
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
            console.log('Swear Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Client({ ws: { intents: intents } })
            defineEvents()
            client.login(sysData.swearKey)
            break
        case 'celebrate':
            celebrate(client).then(channel => {
                channel.send('https://tenor.com/view/im-back-bitches-announcement-inform-welcome-sas-gif-13303187')
            })
            break
        default:
            break
    }
})

process.send('ready')