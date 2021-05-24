process.on('uncaughtException', err => {
    console.log(err)
    setInterval(function () { }, 1000)
})

const Discord = require('discord.js')
const fs = require('fs')
const axios = require('axios')

const client = new Discord.Client()
const prefix = '$'
const home = 'D:/Bot Resources'
const root = '../..'
var sysData = require(`${root}/assets/static/static.json`)
var userData = require(`${home}/sys_files/bots.json`)
var guildStatus = {}

class Deck {

    image
    name
    url
    apiUrl
    authorId

    fill(json) {
        this.image = json.image
        this.name = json.name
        this.url = json.url
        this.apiUrl = json.apiUrl
        this.authorId = json.authorId
    }

    async getInfo(url, authorId) {
        this.authorId = authorId
        this.url = url
        let authorID
        let deckID
        try {
            const fields = url.split('/')
            authorID = fields[4]
            deckID = fields[5].split('-')[0]
        } catch {
            return false
        }
        this.apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
        let deckJson
        try {
            deckJson = await makeGetRequest(this.apiUrl + 'json')
        } catch {
            return false
        }
        for (const deck of userData.decks) {
            if (deck.name == deckJson.name) {
                return false
            }
        }
        this.name = deckJson.name
        let commander = findKey(deckJson, 'isCommander')
        commander = commander.name
        const cardInfo = await makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(commander)}`)
        this.image = cardInfo.data[0].image_uris.large
        return true
    }

    getPreview() {
        const preview = genericEmbedResponse(this.name)
        preview.setImage(this.image)
        preview.addField('Deckstats URL:', this.url)
        return preview
    }

    async getList() {
        const decklist = await makeGetRequest(this.apiUrl + 'list')
        let decklistArray = decklist.list.split("\n")
        for (let i = 0; i < decklistArray.length; i++) {
            if (!decklistArray[i] || decklistArray[i].startsWith('//')) {
                decklistArray.splice(i, 1)
                i--
                continue
            }
            if (decklistArray[i].indexOf('//') != -1) {
                decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('//'))
            }
            if (decklistArray[i].indexOf('#') != -1) {
                decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('#'))
            }
        }
        return '\n' + decklistArray.join('\n')
    }
}

class MagicGame {

    playerInfo
    channel
    numAlive

    constructor(playerList, channel) {
        this.channel = channel
        this.numAlive = playerList.length
        this.playerInfo = {}
        for (const player of playerList) {
            this.playerInfo[player.id] = {
                playerName: player.username,
                lifeTotal: 20,
                poison: 0,
                isAlive: true
            }
        }
    }

    changeLife(player, amount) {
        this.playerInfo[player.id].lifeTotal += amount
        if (this.checkStatus(player)) {
            this.printStandings()
            return
        }
    }

    addPoison(player, amount) {
        this.playerInfo[player.id].poison += amount
        if (this.checkStatus(player)) {
            this.printStandings()
            return
        }
    }

    checkStatus(player) {
        if (this.playerInfo[player.id].lifeTotal < 1 || this.playerInfo[player.id].poison >= 10) {
            this.playerInfo[player.id].isAlive = false
            this.numAlive--
            if (this.numAlive < 2) {
                this.finishGame()
            }
            return false
        }
        return true
    }

    printStandings() {
        const embedVar = genericEmbedResponse('Current Standings')
        for (const player of this.playerInfo) {
            if (player.isAlive) {
                embedVar.addField(`${player.playerName}:`, `Life Total: ${player.lifeTotal}\nPoison Counters: ${player.poison}`)
            } else {
                embedVar.addField(`${player.playerName}:`, 'ELIMINATED')
            }
        }
        this.channel.send(embedVar)
    }

    finishGame() {
        for (const player of this.playerInfo) {
            if (player.isAlive) {
                const embedVar = genericEmbedResponse(`${player.playerName} Wins!!`)
                embedVar.addField(`${player.playerName}:`, `Life Total: ${player.lifeTotal}\nPoison Counters: ${player.poison}`)
                this.channel.send(embedVar)
                break
            }
        }
    }
}

class CommanderGame extends MagicGame {
    constructor(playerList, channel, commanderList) {
        super(playerList, channel)
        //Make changes for commander (life total, times commander cast, commander damage)
    }

    changeLife(player, amount, commander = null) {

    }

    checkStatus(player) {
        return true
        //returns true if they are alive
    }

    printStandings() {

    }

    addCast(commander) {

    }

    getCasts(commander) {

    }
}

function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' })
    return JSON.parse(jsonString)
}

function genericEmbedResponse(title) {
    const embedVar = new Discord.MessageEmbed()
    embedVar.setTitle(title)
    embedVar.setColor(0xffff00)
    return embedVar
}

async function makeGetRequest(path) {
    const response = await axios.get(path)
    return response.data
}

function findKey(object, property) {
    let result
    if (object instanceof Array) {
        for (let i = 0; i < object.length; i++) {
            result = findKey(object[i], property)
            if (result) {
                break
            }
        }
    }
    else {
        for (let prop in object) {
            if (prop == property) {
                if (object[prop]) {
                    return object
                }
            }
            if (object[prop] instanceof Object || object[prop] instanceof Array) {
                result = findKey(object[prop], property)
                if (result) {
                    break
                }
            }
        }
    }
    return result;
}

client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}`)
    client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)])
    setInterval(function () {
        userData = refreshData(`${home}/sys_files/bots.json`)
        client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)])
    }, 60000)
})

async function add(msg) {
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a deckstats URL!')
        return
    }
    const deck = new Deck()
    if (await deck.getInfo(msg.content.split(" ")[1], msg.author.id)) {
        userData = refreshData(`${home}/sys_files/bots.json`)
        userData.decks.push(deck)
        const jsonString = JSON.stringify(userData)
        fs.writeFileSync(`${home}/sys_files/bots.json`, jsonString)
        msg.reply('Success!')
        return
    }
    msg.reply('Something went wrong... (Make sure you are using a valid deck url from deckstats.net and that the deck is not a duplicate)')
}

async function deckPreview(i, msg) {
    const deck = new Deck()
    deck.fill(userData.decks[i])
    const message = await msg.channel.send(deck.getPreview())
    let emojiList = ['\uD83D\uDCC4', '\u274C'] // Page and X emoji
    if (i != 0) {
        emojiList.unshift('\u2B05\uFE0F') // Left arrow
    }
    if (i != (userData.decks.length - 1)) {
        emojiList.push('\u27A1\uFE0F') // Right arrow
    }
    for (const emoji of emojiList) {
        await message.react(emoji)
    }
    const filter = reaction => reaction.client === client
    let reaction = await message.awaitReactions(filter, { max: 1 })
    reaction = reaction.first()
    switch (reaction.emoji.name) {
        case '\uD83D\uDCC4':
            const deckList = await deck.getList()
            msg.reply(deckList)
            message.delete()
            return
        case '\u274C':
            message.delete()
            return
        case '\u2B05\uFE0F':
            message.delete()
            deckPreview((i - 1), msg)
            return
        case '\u27A1\uFE0F':
            message.delete()
            deckPreview((i + 1), msg)
            return
        default:
            message.delete()
            return
    }
}

client.on('message', msg => {
    if (msg.author.bot || !msg.content.startsWith(prefix) || !msg.guild) {
        return
    }

    let messageStart = msg.content.split(" ")[0].slice(1)

    try {
        switch (messageStart) {
            case 'add':
                add(msg)
                break
            case 'decks':
                deckPreview(0, msg)
                break
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

client.login(sysData.krenkoKey)