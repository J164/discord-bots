import { BitFieldResolvable, Client, IntentsString } from 'discord.js'
import { celebrate, sysData } from '../../core/common'
import { DatabaseManager } from '../../core/DatabaseManager'
import { PotatoGuildInputManager } from './PotatoGuildInputManager'

const intents: BitFieldResolvable<IntentsString> = [ 'GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS' ]
let client = new Client({ ws: { intents: intents } })
const database = new DatabaseManager()
const guildStatus = new Map<string, PotatoGuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`)
        process.send('start')

        client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)])

        setInterval(() => {
            client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)])

            for (const [ , guildManager ] of guildStatus) {
                guildManager.voiceManager.checkIsIdle()
            }
        }, 60000)
    })

    client.on('message', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new PotatoGuildInputManager(message.guild, database))
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
            console.log('Potato Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Client({ ws: { intents: intents } })
            defineEvents()
            client.login(sysData.potatoKey)
            break
        case 'celebrate':
            celebrate(client).then(channel => {
                channel.send('https://tenor.com/view/husky-husky-jump-youre-home-welcome-home-excited-gif-15653370')
                channel.send('WELCOME BACK!!!!')
            })
            break
        default:
            break
    }
})

process.send('ready')