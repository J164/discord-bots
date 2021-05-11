process.on('uncaughtException', err => {
    console.log(err)
    setInterval(function () { }, 1000)
})

const Discord = require('discord.js')
const fs = require('fs')
const axios = require('axios')

const client = new Discord.Client()
const prefix = '$'
var data = require('C:/Users/jacob/Downloads/Bot Resources/sys_files/bots.json')
var guildStatus = {}
var deck

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

class Deck {

    image
    name
    url
    apiUrl
    authorId

    constructor(url, authorId) {
        this.authorId = authorId
        this.url = url
        const fields = url.split('/')
        const authorID = fields[4]
        const deckID = fields[5].split('-')[0]
        this.apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
    }

    async getInfo() {
        const deckJson = await makeGetRequest(this.apiUrl + 'json')
        this.name = deckJson['name']
        let commander = findKey(deckJson, 'isCommander')
        commander = commander['name']
        const cardInfo = await makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(commander)}`)
        this.image = cardInfo['data'][0]['image_uris']['large']
    }

    getPreview() {
        const preview = genericEmbedResponse(this.name)
        preview.setImage(this.image)
        preview.addField('Deckstats URL:', this.url)
        return preview
    }

    async getList() {
        const decklist = await makeGetRequest(this.apiUrl + 'list')
        return decklist.list
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
        this.playerInfo[player.id]['lifeTotal'] += amount
        if (this.checkStatus(player)) {
            this.printStandings()
            return
        }
    }

    addPoison(player, amount) {
        this.playerInfo[player.id]['poison'] += amount
        if (this.checkStatus(player)) {
            this.printStandings()
            return
        }
    }

    checkStatus(player) {
        if (this.playerInfo[player.id]['lifeTotal'] < 1 || this.playerInfo[player.id]['poison'] >= 10) {
            this.playerInfo[player.id]['isAlive'] = false
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
            if (player['isAlive']) {
                embedVar.addField(`${player['playerName']}:`, `Life Total: ${player['lifeTotal']}\nPoison Counters: ${player['poison']}`)
            } else {
                embedVar.addField(`${player['playerName']}:`, 'ELIMINATED')
            }
        }
        this.channel.send(embedVar)
    }

    finishGame() {
        for (const player of this.playerInfo) {
            if (player['isAlive']) {
                const embedVar = genericEmbedResponse(`${player['playerName']} Wins!!`)
                embedVar.addField(`${player['playerName']}:`, `Life Total: ${player['lifeTotal']}\nPoison Counters: ${player['poison']}`)
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

client.on('ready', () => {
    //deck = new Deck('https://deckstats.net/decks/162326/2048957-artifacts-troll-', 123)
    console.log(`We have logged in as ${client.user.tag}`)
    client.user.setActivity(data['krenkoStatus'][Math.floor(Math.random() * data['krenkoStatus'].length)])
    setInterval(function () {
        refreshData('C:/Users/jacob/Downloads/Bot Resources/sys_files/bots.json')
        client.user.setActivity(data['krenkoStatus'][Math.floor(Math.random() * data['krenkoStatus'].length)])
    }, 60000)
})

async function add(msg) {
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a deckstats URL!')
        return
    }
    refreshData('C:/Users/jacob/Downloads/Bot Resources/sys_files/bots.json')
    const deck = new Deck(msg.content.split(" ")[1], msg.author.id)
    await deck.getInfo()
    data['decks'].push(deck)
    const jsonString = JSON.stringify(data)
    fs.writeFileSync('C:/Users/jacob/Downloads/Bot Resources/sys_files/bots.json', jsonString)
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
            case 'remove':
                break
            case 'decks':
                break
            case 'test':
                msg.channel.send(deck.getPreview())
                deck.getList()
                    .then(list => {
                        msg.channel.send(list)
                    })
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

client.login(data['krenkoKey'])