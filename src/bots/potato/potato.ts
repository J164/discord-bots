import { Client } from 'discord.js'
import { sysData } from '../../core/common'
import { PotatoGuildInputManager } from './PotatoGuildInputManager'

const client = new Client({ ws: { intents: [ 'GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS' ]} })
const guildStatus = new Map<string, PotatoGuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`)
        process.send('start')

        client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)])

        setInterval(function () {
            client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)])

            for (const [ , guildManager ] of guildStatus) {
                guildManager.voiceManager.checkIsIdle()
            }
        }, 60000)
    })

    client.on('message', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new PotatoGuildInputManager(message.guild))
        }

        guildStatus.get(message.guild.id).parseInput(message)
            .then(response => {
                if (response) {
                    message.reply(response)
                }
            })
    })
}

process.on('message', function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            guildStatus.clear()
            console.log('Potato Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            defineEvents()
            client.login(sysData.potatoKey)
            break
        default:
            break
    }
})

process.send('ready')