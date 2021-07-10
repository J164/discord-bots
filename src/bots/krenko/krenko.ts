import { Client } from 'discord.js'
import { sysData } from '../../core/common'
import { KrenkoGuildInputManager } from './KrenkoGuildInputManager'

const client = new Client({ ws: { intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS']} })
const guildStatus = new Map<string, KrenkoGuildInputManager>()

function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`)
        process.send('start')
        client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)])
        setInterval(function () {
            client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)])
        }, 60000)
    })

    client.on('message', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new KrenkoGuildInputManager(message.guild, client))
        }

        guildStatus.get(message.guild.id).parseInput(message)
            .then(response => {
                if (response) {
                    message.reply(response)
                }
            })
    })
}

process.on("message", function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            guildStatus.clear()
            console.log('Krenko Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            defineEvents()
            client.login(sysData.krenkoKey)
            break
    }
})

process.send('ready')