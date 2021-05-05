process.on('uncaughtException', err => {
    console.log(err)
    setInterval(function () { }, 1000)
})

const Discord = require('discord.js')
const fs = require('fs')

const client = new Discord.Client()
const prefix = '$'
var data = require('../files/bots.json')
var guildStatus = {}

function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' })
    data = JSON.parse(jsonString)
}

function genericEmbedResponse(title) {
    const embedVar = new Discord.MessageEmbed()
    embedVar.setTitle(title)
    embedVar.setColor(0xffff00)
    return embedVar
}

client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}`)
    client.user.setActivity(data['krenkoStatus'][Math.floor(Math.random() * data['krenkoStatus'].length)])
    setInterval(function () {
        refreshData('../files/bots.json')
        client.user.setActivity(data['krenkoStatus'][Math.floor(Math.random() * data['krenkoStatus'].length)])
    }, 60000)
})

client.on('message', msg => {
    if (msg.author.bot || !msg.content.startsWith(prefix)) {
        return
    }

    let messageStart = msg.content.split(" ")[0].slice(1)

    try {
        switch (messageStart) {
            case 'roll':
                let dice = 6
                if (msg.content.split(" ").length > 1) {
                    let arg = parseInt(msg.content.split(" ")[1])
                    if (!isNaN(arg) && arg > 0) {
                        dice = arg
                    }
                }
                msg.channel.send(`Rolling a ${dice}-sided die...`)
                const diceResult = genericEmbedResponse(`${dice}-sided die result`)
                diceResult.addField(`${Math.floor((Math.random() * (dice - 1)) + 1)}`, `The chance of getting this result is about ${Math.round(100 / dice)}%`)
                msg.reply(diceResult)
                break
            case 'flip':
                const flip = Math.random()
                const flipResult = genericEmbedResponse('Flip Result:')
                if (flip >= 0.5) {
                    flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png')
                } else {
                    flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png')
                }
                msg.reply(flipResult)
                break
        }
    } catch (err) {
        console.log(err)
    }
})

client.login(data['krenkoKey'])