process.on('uncaughtException', err => {
    console.log(err)
    setInterval(function () { }, 1000)
})

const Discord = require('discord.js')
const fs = require('fs')

const client = new Discord.Client()
const prefix = '?'
var data = require('../files/bots.json')
var guildStatus = {}

function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' })
    data = JSON.parse(jsonString)
}

client.on('ready', () => {
    console.log('We have logged in as ' + client.user.tag)
    client.user.setActivity(data['swearStatus'][Math.floor(Math.random() * data['swearStatus'].length)])
    setInterval(function () {
        refreshData('../files/bots.json')
        client.user.setActivity(data['swearStatus'][Math.floor(Math.random() * data['swearStatus'].length)])
        for (const key in guildStatus) {
            if ('audio' in guildStatus[key] && !guildStatus[key]['audio']) {
                try {
                    guildStatus[key]['voice'].disconnect()
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
    try {
        if (parseInt(msg.content.split(" ")[1]) <= data['swearSongs'].length && parseInt(msg.content.split(" ")[1]) > 0) {
            songNum = parseInt(msg.content.split(" ")[1]) - 1
        } else {
            songNum = Math.floor(Math.random() * data['swearSongs'].length)
        }
    } catch {
        songNum = Math.floor(Math.random() * data['swearSongs'].length)
    }
    if (!(msg.guild.toString() in guildStatus)) {
        guildStatus[msg.guild.toString()] = {}
    }
    guildStatus[msg.guild.toString()]['audio'] = true
    let voice = await vc.join()
    guildStatus[msg.guild.toString()]['voice'] = voice
    if ('dispatcher' in guildStatus[msg.guild.toString()]) {
        try {
            guildStatus[msg.guild.toString()]['dispatcher'].destroy()
        } catch { }
    }
    guildStatus[msg.guild.toString()]['dispatcher'] = voice.play('C:/Users/jacob/Downloads/Bot Resources/music_files/swear_songs/' + data['swearSongs'][songNum])
    guildStatus[msg.guild.toString()]['dispatcher'].on('finish', () => {
        guildStatus[msg.guild.toString()]['dispatcher'].destroy()
        guildStatus[msg.guild.toString()]['audio'] = false
    })
}

client.on('message', msg => {
    if (msg.author.bot) {
        return
    }

    if (!msg.content.startsWith(prefix)) {
        if (msg.content.indexOf('swear') != -1) {
            msg.reply(data['blacklist']['swears'][Math.floor(Math.random() * data['blacklist']['swears'].length)])
            return
        }
        for (const swear of data['blacklist']['swears']) {
            if (msg.content.indexOf(swear) != -1) {
                msg.reply('Good job swearing! Heck yeah!')
                return
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
                if (msg.guild.toString() in guildStatus && 'dispatcher' in guildStatus[msg.guild.toString()]) {
                    guildStatus[msg.guild.toString()]['dispatcher'].pause()
                    msg.reply('Paused!')
                } else {
                    msg.reply('Nothing is playing!')
                }
                break
            case 'resume':
                if (msg.guild.toString() in guildStatus && 'dispatcher' in guildStatus[msg.guild.toString()]) {
                    guildStatus[msg.guild.toString()]['dispatcher'].resume()
                    msg.reply('Resumed!')
                } else {
                    msg.reply('Nothing is playing!')
                }
                break
            case 'stop':
                if (msg.guild.toString() in guildStatus && 'dispatcher' in guildStatus[msg.guild.toString()]) {
                    guildStatus[msg.guild.toString()]['dispatcher'].destroy()
                    guildStatus[msg.guild.toString()]['audio'] = false
                    msg.reply('Success')
                } else {
                    msg.reply('There is nothing playing!')
                }
                break
        }
    } catch (err) {
        console.log(err)
    }
})

client.login(data['swearKey'])