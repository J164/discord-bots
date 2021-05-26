process.on('uncaughtException', err => {
    console.log(err)
    setInterval(function () { }, 1000)
})

const Discord = require('discord.js')
const fs = require('fs')

const client = new Discord.Client()
const prefix = '?'
const home = 'D:/Bot Resources'
const root = '../..'
var sysData = require(`${root}/assets/static/static.json`)
var userData = require(`${home}/sys_files/bots.json`)
var guildStatus = {}

function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' })
    return JSON.parse(jsonString)
}

client.on('ready', () => {
    console.log('We have logged in as ' + client.user.tag)
    client.user.setActivity(sysData.swearStatus[Math.floor(Math.random() * sysData.swearStatus.length)])
    setInterval(function () {
        userData = refreshData(`${home}/sys_files/bots.json`)
        client.user.setActivity(sysData.swearStatus[Math.floor(Math.random() * sysData.swearStatus.length)])
        for (const key in guildStatus) {
            if ('audio' in guildStatus[key] && !guildStatus[key].audio) {
                try {
                    guildStatus[key].voice.disconnect()
                } catch { }
            }
        }
    }, 60000)
})

async function play(msg) {
    let songNum
    let vc = msg.member.voice.channel
    if (!vc) {
        msg.reply('This command can only be used while in a voice channel!')
        return
    }
    let loop = false
    try {
        if (parseInt(msg.content.split(" ")[1]) <= userData.swearSongs.length && parseInt(msg.content.split(" ")[1]) > 0) {
            songNum = parseInt(msg.content.split(" ")[1]) - 1
        } else {
            loop = true
            songNum = Math.floor(Math.random() * userData.swearSongs.length)
        }
    } catch {
        loop = true
        songNum = Math.floor(Math.random() * userData.swearSongs.length)
    }
    if (!(msg.guild.id in guildStatus)) {
        guildStatus[msg.guild.id] = {}
    }
    guildStatus[msg.guild.id].audio = true
    let voice = await vc.join()
    guildStatus[msg.guild.id].voice = voice
    if ('dispatcher' in guildStatus[msg.guild.id]) {
        try {
            guildStatus[msg.guild.id].dispatcher.destroy()
        } catch { }
    }
    guildStatus[msg.guild.id].dispatcher = voice.play(`${home}/music_files/swear_songs/${userData.swearSongs[songNum]}`)
    guildStatus[msg.guild.id].dispatcher.on('finish', () => {
        guildStatus[msg.guild.id].dispatcher.destroy()
        guildStatus[msg.guild.id].audio = false
        if (loop) {
            play(msg)
        }
    })
}

client.on('message', msg => {
    if (msg.author.bot || !msg.guild) {
        return
    }

    if (!(msg.guild.id in guildStatus)) {
        guildStatus[msg.guild.id] = {}
    }

    if (!msg.content.startsWith(prefix)) {
        for (const word of msg.content.toLowerCase().split(" ")) {
            if (word == 'swear') {
                msg.reply(sysData.blacklist.swears[Math.floor(Math.random() * sysData.blacklist.swears.length)])
                return
            }
        }
        for (const word of msg.content.toLowerCase().split(" ")) {
            for (const swear of sysData.blacklist.swears) {
                if (word == swear) {
                    msg.reply('Good job swearing! Heck yeah!')
                    return
                }
            }
        }
        return
    }

    let messageStart = msg.content.split(" ")[0].slice(1)

    try {
        switch (messageStart) {
            case 'play':
                play(msg)
                break
            case 'pause':
                if (!('dispatcher' in guildStatus[msg.guild.id])) {
                    msg.reply('Nothing is playing!')
                    return
                }
                guildStatus[msg.guild.id].dispatcher.pause()
                msg.reply('Paused!')
                break
            case 'resume':
                if (!('dispatcher' in guildStatus[msg.guild.id])) {
                    msg.reply('Nothing is playing!')
                    return
                }
                guildStatus[msg.guild.id].dispatcher.resume()
                msg.reply('Resumed!')
                break
            case 'stop':
                if (!('dispatcher' in guildStatus[msg.guild.id])) {
                    msg.reply('There is nothing playing!')
                    return
                }
                guildStatus[msg.guild.id].dispatcher.destroy()
                guildStatus[msg.guild.id].audio = false
                msg.reply('Success')
                break
        }
    } catch (err) {
        console.log(err)
    }
})

client.login(sysData.swearKey)