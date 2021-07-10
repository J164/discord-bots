import { Client } from 'discord.js'
import { sysData } from '../../core/common'

const client = new Client({ ws: { intents: ['GUILDS', 'GUILD_MESSAGES'] } })

function defineEvents() {
    client.on('ready', () => {
        console.log('We have logged in as ' + client.user.tag)
        process.send('start')
        client.user.setActivity(sysData.yeetStatus[Math.floor(Math.random() * sysData.yeetStatus.length)])
        setInterval(function () {
            client.user.setActivity(sysData.yeetStatus[Math.floor(Math.random() * sysData.yeetStatus.length)])
        }, 60000)
    })

    client.on('message', msg => {
        if (msg.author.bot || !msg.guild) {
            return
        }

        if (msg.content.toLowerCase().indexOf('yee') !== -1) {
            if (msg.content.toLowerCase().substr(msg.content.toLowerCase().indexOf('yee') + 1, 10) === 'eeeeeeeeee') {
                msg.reply('Wow! Much Yeet!')
                return
            }
            msg.reply('YEEEEEEEEEET!')
        }
    })
}

process.on("message", function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log('Yeet Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            defineEvents()
            client.login(sysData.yeetKey)
            break
    }
})

process.send('ready')