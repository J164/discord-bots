process.on('uncaughtException', err => {
    console.log(err)
    setInterval(function () { }, 1000)
})

const Discord = require('discord.js') // Discord api library
const fs = require('fs') // Filesystem
const axios = require('axios') // Used to make http requests
const canvas = require('canvas') // Allows the manipulation of images
const youtubedl = require('youtube-dl-exec') // Youtube video downloader

const client = new Discord.Client() // Represents the bot client
const prefix = '&' // Bot command prefix
const home = process.env.USERPROFILE // Represents path to user profile
const root = '../..'
var sysData = require(`${root}/assets/static/static.json`) // Loads system info into memory
var userData = require(`${home}/Downloads/Bot Resources/sys_files/bots.json`) // Loads persistant info into memory
var users = {
    admin: null,
    swear: null
} // Stores specific users
var guildStatus = {} // Stores guild specific information to allow bot to act independent in different guilds

class Euchre {

    // Instance variables
    team1 
    team2
    deckID
    active
    gameState
    players

    constructor(players) {
        this.team1 = {
            'tricks': 0,
            'score': 0
        }
        this.team2 = {
            'tricks': 0,
            'score': 0
        }
        this.players = [{
            'id': 0,
            'user': players[0],
            'hand': [],
            'team': this.team1
        },
        {
            'id': 1,
            'user': players[1],
            'hand': [],
            'team': this.team2
        },
        {
            'id': 2,
            'user': players[2],
            'hand': [],
            'team': this.team1
        },
        {
            'id': 3,
            'user': players[3],
            'hand': [],
            'team': this.team2
        }]
        this.active = true
        this.gameState = {
            'top': {},
            'inPlay': [],
            'trump': ''
        }
    }

    async startGame() {
        await this.startRound()
        while (this.team1.score < 10 && this.team2.score < 10) {
            const newOrder = [this.players[3], this.players[0], this.players[1], this.players[2]]
            this.players = newOrder
            await this.startRound()
        }
        const results = genericEmbedResponse('Game Over!')
        results.addField('Players', `${this.players[0].id}, ${this.players[1].id}, ${this.players[2].id}, ${this.players[3].id}`)
        if (this.team1.score > 10) {
            results.addField('Team 1 Wins!', `${this.team1.score} - ${this.team2.score}`)
        } else {
            results.addField('Team 2 Wins!', `${this.team2.score} - ${this.team1.score}`)
        }
        return results
    }

    async startRound() {
        let deck
        let draws
        let success = false
        while (!success) {
            try {
                deck = await axios.post('https://deckofcardsapi.com/api/deck/new/shuffle?cards=9S,9D,9C,9H,0S,0D,0C,0H,JS,JD,JC,JH,QS,QD,QC,QH,KS,KD,KC,KH,AS,AD,AC,AH')
                draws = await axios.post(`https://deckofcardsapi.com/api/deck/${deck.data.deck_id}/draw?count=21`)
                success = true
            } catch {}
        }
        const output = draws.data
        this.players[0].hand = [output.cards[0], output.cards[4], output.cards[8], output.cards[12], output.cards[16]]
        this.players[1].hand = [output.cards[1], output.cards[5], output.cards[9], output.cards[13], output.cards[17]]
        this.players[2].hand = [output.cards[2], output.cards[6], output.cards[10], output.cards[14], output.cards[18]]
        this.players[3].hand = [output.cards[3], output.cards[7], output.cards[11], output.cards[15], output.cards[19]]
        this.gameState.top = output.cards[20]
        for (const player of this.players) {
            await this.sendHand(player)
        }
        await this.sendCards(`${root}/assets/img/cards/${this.gameState.top.code}.png`, 'Top of Stack:')
        let playerUsers = []
        for (const player of this.players) {
            playerUsers.push(player)
        }
        for (const player of this.players) {
            const response = await this.askPlayer(player.user, `Would you like to pass or have ${this.players[3].user.username} pick it up?`, ['Pick it up', 'Pass'])
            if (response == 0) {
                this.gameState.trump = this.gameState.top.suit
                this.players[3].hand[await this.askPlayer(this.players[3].user, 'What card would you like to replace?', this.getCardNames(this.players[3].hand))] = this.gameState.top
                this.sendHand(this.players[3])
                if (await this.askPlayer(player.user, 'Would you like to go alone?', ['Yes', 'No']) == 0) {
                    switch (player.id) {
                        case 0:
                            playerUsers.splice(2, 1)
                            break
                        case 1:
                            playerUsers.splice(3, 1)
                            break
                        case 2:
                            playerUsers.splice(0, 1)
                            break
                        case 3:
                            playerUsers.splice(1, 1)
                            break
                    }
                    await this.tricks(playerUsers, player.team, true)
                    return
                }
                await this.tricks(playerUsers, player.team, false)
                return
            }
        }
        let availableSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades', 'Pass']
        availableSuits.splice(availableSuits.indexOf(`${this.gameState.top.suit[0]}${this.gameState.top.suit.slice(1).toLowerCase()}`), 1)
        for (const [i, player] of this.players.entries()) {
            if (i == 3) {
                availableSuits.splice(availableSuits.length - 1, 1)
            }
            const response = await this.askPlayer(player.user, 'What would you like to be trump?', availableSuits)
            if (response != 3) {
                this.gameState.trump = availableSuits[response].toUpperCase()
                if (await this.askPlayer(player.user, 'Would you like to go alone?', ['Yes', 'No']) == 0) {
                    switch (player.id) {
                        case 0:
                            playerUsers.splice(2, 1)
                            break
                        case 1:
                            playerUsers.splice(3, 1)
                            break
                        case 2:
                            playerUsers.splice(0, 1)
                            break
                        case 3:
                            playerUsers.splice(1, 1)
                            break
                    }
                    await this.tricks(playerUsers, player.team, true)
                    return
                }
                await this.tricks(playerUsers, player.team, false)
                return
            }
        }
    }

    async tricks(activePlayers, leader, solo) {
        for (let r = 0; r < 5; r++) {
            let table = []
            let lead
            for (const player of activePlayers) {
                await this.sendHand(player)
                if (lead == null && table.length > 0) {
                    lead = table[0].suit
                }
                let availableHand = []
                let handIndices = []
                let hasLead = false
                if (lead != null) {
                    for (const [i, card] of player.hand.entries()) {
                        if (this.realSuit(card) == lead) {
                            availableHand.push(card)
                            handIndices.push(i)
                            hasLead = true
                        }
                    }
                    if (!hasLead) {
                        availableHand = player.hand
                        for (let i = 0; i < availableHand.length; i++) {
                            handIndices.push(i)
                        }
                    }
                } else {
                    availableHand = player.hand
                    for (let i = 0; i < availableHand.length; i++) {
                        handIndices.push(i)
                    }
                }
                const response = await this.askPlayer(player.user, 'What would you like to play?', this.getCardNames(availableHand))
                table.push(availableHand[response])
                player.hand.splice(handIndices[response], 1)
                await this.sendHand(player)
                await this.sendCards(table, 'Table:')
            }
            let leadingPlayer
            let leadingScore = 0
            for (const [i, card] of table.entries()) {
                if (this.realSuit(card) == this.gameState.trump) {
                    switch (card.code[0]) {
                        case '9':
                            if (7 > leadingScore) {
                                leadingScore = 7
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case '10':
                            if (8 > leadingScore) {
                                leadingScore = 8
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'Q':
                            if (9 > leadingScore) {
                                leadingScore = 9
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'K':
                            if (10 > leadingScore) {
                                leadingScore = 10
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'A':
                            if (11 > leadingScore) {
                                leadingScore = 11
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'J':
                            if (this.realSuit(card) == card.suit && 13 > leadingScore) {
                                leadingScore = 13
                                leadingPlayer = activePlayers[i]
                            } else if (12 > leadingScore) {
                                leadingScore = 12
                                leadingPlayer = activePlayers[i]
                            }
                            break
                    }
                } else if (card.suit == lead) {
                    switch (card.code[0]) {
                        case '9':
                            if (1 > leadingScore) {
                                leadingScore = 1
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case '10':
                            if (2 > leadingScore) {
                                leadingScore = 2
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'J':
                            if (3 > leadingScore) {
                                leadingScore = 3
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'Q':
                            if (4 > leadingScore) {
                                leadingScore = 4
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'K':
                            if (5 > leadingScore) {
                                leadingScore = 5
                                leadingPlayer = activePlayers[i]
                            }
                            break
                        case 'A':
                            if (6 > leadingScore) {
                                leadingScore = 6
                                leadingPlayer = activePlayers[i]
                            }
                            break
                    }
                }
            }
            if (leadingPlayer.id % 2 == 0) {
                this.team1.tricks++
            } else {
                this.team2.tricks++
            }
            const tricksWon = genericEmbedResponse('Tricks Won:')
            tricksWon.addField('Team 1:', this.team1.tricks)
            tricksWon.addField('Team 2:', this.team2.tricks)
            for (const player of this.players) {
                const channel = await player.user.createDM()
                await channel.send(tricksWon)
            }
        }

        /* POTENTIAL SCORES
        * basic (1)
        * euch (2)
        * sweep (2)
        * solo sweep (4)
        */

        let winningTeam
        if (this.team1.tricks > this.team2.tricks) {
            winningTeam = this.team1
        } else {
            winningTeam = this.team2
        }
        if (winningTeam == leader) {
            if (winningTeam.tricks == 5) {
                if (solo) {
                    winningTeam.score += 4
                } else {
                    winningTeam.score += 2
                }
            } else {
                winningTeam.score++
            }
        } else {
            winningTeam.score += 2
        }
        const standings = genericEmbedResponse('Tricks Won:')
        standings.addField('Team 1:', this.team1.score)
        standings.addField('Team 2:', this.team2.score)
        for (const player of this.players) {
            const channel = await player.user.createDM()
            await channel.send(standings)
        }
    }

    //used to check for left bower
    realSuit(card) {
        if (card.code[0] != 'J') {
            return card.suit
        }
        switch (card.suit) {
            case 'CLUBS':
                if (this.gameState.trump == 'SPADES') {
                    return 'SPADES'
                }
                break
            case 'SPADES':
                if (this.gameState.trump == 'CLUBS') {
                    return 'CLUBS'
                }
                break
            case 'HEARTS':
                if (this.gameState.trump == 'DIAMONDS') {
                    return 'DIAMOND'
                }
                break
            case 'DIAMONDS':
                if (this.gameState.trump == 'HEARTS') {
                    return 'HEARTS'
                }
                break
        }
        return card.suit
    }

    getCardNames(hand) {
        let names = []
        for (const card of hand) {
            names.push(`${card.value[0]}${card.value.slice(1).toLowerCase()} of ${card.suit[0]}${card.suit.slice(1).toLowerCase()}`)
        }
        return names
    }

    async askPlayer(player, question, responses) {
        const channel = await player.createDM()
        const prompt = genericEmbedResponse(question)
        for (let i = 0; i < responses.length; i++) {
            prompt.addField(`${(i + 1)}. `, responses[i])
        }
        const message = await channel.send(prompt)
        const emojiList = ['1\ufe0f\u20e3', '2\ufe0f\u20e3', '3\ufe0f\u20e3', '4\ufe0f\u20e3', '5\ufe0f\u20e3', '6\ufe0f\u20e3', '7\ufe0f\u20e3', '8\ufe0f\u20e3', '9\ufe0f\u20e3', '\ud83d\udd1f']
        for (let i = 0; i < responses.length; i++) {
            await message.react(emojiList[i])
        }
        const filter = reaction => reaction.client === client
        let reaction = await message.awaitReactions(filter, { max: 1 })
        reaction = reaction.first()
        for (let i = 0; i < emojiList.length; i++) {
            if (reaction.emoji.name === emojiList[i]) {
                return i
            }
        }
    }

    async sendHand(player) {
        let filePaths = []
        const hand = genericEmbedResponse('^ Your Hand:')
        for (const card of player.hand) {
            filePaths.push(`${root}/assets/img/cards/${card.code}.png`)
        }
        if (filePaths.length == 1) {
            hand.attachFiles([{
                attachment: filePaths[0],
                name: 'hand.png'
            }])
            const channel = await player.user.createDM()
            await channel.send(hand)
            return
        }
        const image = await mergeImages(filePaths, {
            width: filePaths.length * 226,
            height: 314
        })
        hand.attachFiles([{
            attachment: image,
            name: 'hand.png'
        }])
        const channel = await player.user.createDM()
        await channel.send(hand)
    }

    async sendCards(cards, message) {
        const response = genericEmbedResponse(`^ ${message}`)
        if (typeof cards == "string") {
            response.attachFiles([{
                attachment: cards,
                name: `${message}.png`
            }])
        } else {
            let filePaths = []
            for (let i = 0; i < cards.length; i++) {
                filePaths.push(`${home}/assets/img/cards/${cards[i].code}.png`)
            }
            const image = await mergeImages(filePaths, {
                width: filePaths.length * 226,
                height: 314
            })
            response.attachFiles([{
                attachment: image,
                name: `${message}.png`
            }])
        }
        for (const player of this.players) {
            const channel = await player.user.createDM()
            await channel.send(response)
        }
    }
}

// Merges multiple images into one image
async function mergeImages(filePaths, options) {
    const activeCanvas = canvas.createCanvas(options.width, options.height)
    const ctx = activeCanvas.getContext('2d')
    for (const [i, path] of filePaths.entries()) {
        const image = await canvas.loadImage(path)
        ctx.drawImage(image, i * (options.width / filePaths.length), 0)
    }
    return activeCanvas.toBuffer()
}

// Creates a commonly used discord embed
function genericEmbedResponse(title) {
    const embedVar = new Discord.MessageEmbed()
    embedVar.setTitle(title)
    embedVar.setColor(0x0099ff)
    return embedVar
}

// Refreshes the data variable
function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' })
    userData = JSON.parse(jsonString)
}

// Makes a http get request
async function makeGetRequest(path) {
    const response = await axios.get(path)
    return response.data
}

// Recursively plays each video in the queue
async function playQueue(channel, guild, vc) {
    if (fs.existsSync(`${home}/Downloads/Bot Resources/temp/${guild.id}/song.mp3`)) {
        fs.unlinkSync(`${home}/Downloads/Bot Resources/temp/${guild.id}/song.mp3`)
    }
    if (guildStatus[guild.id].queue.length < 1) {
        return
    }
    guildStatus[guild.id].audio = true
    const voice = await vc.join()
    guildStatus[guild.id].voice = voice
    const currentSong = guildStatus[guild.id].queue.shift()
    await youtubedl(currentSong.webpage_url, {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        ignoreErrors: true,
        geoBypass: true,
        format: 'bestaudio',
        output: `${home}/Downloads/Bot Resources/temp/${guild.id}/song.mp3`
    })
    guildStatus[guild.id].dispatcher = voice.play(`${home}/Downloads/Bot Resources/temp/${guild.id}/song.mp3`)
    guildStatus[guild.id].nowPlaying = genericEmbedResponse(`Now Playing: ${currentSong['title']}`)
    guildStatus[guild.id].nowPlaying.setImage(currentSong['thumbnail'])
    guildStatus[guild.id].nowPlaying.addField('URL:', currentSong['webpage_url'])
    channel.send(guildStatus[guild.id].nowPlaying)
    guildStatus[guild.id].dispatcher.on('finish', () => {
        guildStatus[guild.id].dispatcher.destroy()
        guildStatus[guild.id].audio = false
        playQueue(channel, guild, vc)
    })
}

// Fetches a user from a specific guild using their ID
async function getUser(guildId, userId) {
    const guild = await client.guilds.fetch(guildId)
    const user = await guild.members.fetch({ user: userId })
    return user
}

// This block executes when the bot is launched
client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}`)

    // Removes the temp folder if it exists
    if (fs.existsSync(`${home}/Downloads/Bot Resources/temp`)) {
        fs.rmdirSync(`${home}/Downloads/Bot Resources/temp`, { recursive: true })
    }

    fs.mkdirSync(`${home}/Downloads/Bot Resources/temp`) // Creates a temp folder for this session
    client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)]) // Sets bot status

    // Fetches any necessary user objects
    getUser('619975185029922817', '609826125501169723')
        .then(admin => { users.admin = admin.user })

    getUser('619975185029922817', '633046187506794527')
        .then(swear => { users.swear = swear.user })

    // Defines tasks that must be executed periodically
    setInterval(function () {
        refreshData(`${home}/Downloads/Bot Resources/sys_files/bots.json`) // Refresh user data variable
        client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)]) // Reset bot status

        // Disconnects bot if it is inactive in a voice channel
        for (const guild in guildStatus) {
            if ('audio' in guildStatus[guild] && !guildStatus[guild].audio) {
                try {
                    guildStatus[guild].voice.disconnect()
                } catch { }
            }
        }
    }, 60000) // Defines the time between executions in ms
})

// Functions for specific commands

async function wynncraftStats(msg) {
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a player username')
        return
    }
    const f = await makeGetRequest(`https://api.wynncraft.com/v2/player/${msg.content.split(" ")[1]}/stats`)
    let current
    let playtimeStr
    let hPlaytimeStr
    const embedVar = new Discord.MessageEmbed()
    embedVar.setTitle(f.data[0].username)
    if (f.data[0].meta.location.online) {
        current = `Online at: ${f.data[0].meta.location.server}`
        embedVar.setColor(0x33cc33)
    } else {
        current = 'Offline'
        embedVar.setColor(0xff0000)
    }
    embedVar.addField('Current Status', current)
    for (let i = 0; i < f.data[0].classes.length; i++) {
        let playtime = f.data[0].classes[i].playtime
        const hPlaytime = Math.floor(playtime / 60)
        playtime = playtime % 60
        if (playtime < 10) {
            playtimeStr = `0${playtime}`
        } else {
            playtimeStr = playtime.toString()
        }
        if (hPlaytime < 10) {
            hPlaytimeStr = `0${hPlaytime}`
        } else {
            hPlaytimeStr = hPlaytime.toString()
        }
        embedVar.addField(`Profile ${(i + 1)}`, `Class: ${f.data[0].classes[i].name}\nPlaytime: ${hPlaytimeStr}:${playtimeStr}\nCombat Level: ${f.data[0].classes[i].professions.combat.level}`)
    }
    msg.reply(embedVar)
}

async function newSwearSong(msg) {
    if (msg.author != users.admin && msg.author != users.swear) {
        msg.reply('You don\'t have permission to use this command!')
        return
    }
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a video url')
        return
    }
    msg.channel.send('Getting information on new song...')
    const output = await youtubedl(msg.content.split(" ")[1], {
        dumpJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        ignoreErrors: true
    })
    try {
        if ('entries' in output) {
            msg.reply('Please only enter a single video at a time')
            return
        }
        if (output.duration > 1200) {
            msg.reply('The video length limit is 20 minutes! Aborting...')
            return
        }
    } catch {
        msg.reply('It appears the video was unavailable')
        return
    }
    msg.channel.send('Downloading...')
    youtubedl(msg.content.split(" ")[1], {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/Downloads/Bot Resources/music_files/swear_songs/song${userData.swearSongs.length + 1}.mp3`
    })
    refreshData(`${home}/Downloads/Bot Resources/sys_files/bots.json`)
    userData.swearSongs.push(`song${(userData.swearSongs.length + 1)}.mp3`)
    const jsonString = JSON.stringify(userData)
    fs.writeFileSync(`${home}/Downloads/Bot Resources/sys_files/bots.json`, jsonString)
    msg.reply('Success!')
}

async function download(msg) {
    if (msg.author != users.admin) {
        msg.reply('You don\'t have permission to use this command!')
        return
    }
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a video url')
        return
    }
    let options = {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/Downloads/Bot Resources/New Downloads/%(title)s.%(ext)s`,
        ignoreErrors: true
    }
    if (msg.content.split(" ").length < 3 || msg.content.split(" ")[2][0].toLowerCase() != 'a') {
        options.format = 'bestvideo,bestaudio'
    }
    msg.channel.send('Downloading...')
    await youtubedl(msg.content.split(" ")[1], options)
    msg.reply('Download Successful!')
}

async function play(msg) {
    let url
    const voiceChannel = msg.member.voice.channel
    if (!voiceChannel) {
        msg.reply('This command can only be used while in a voice channel!')
        return
    }
    if (!voiceChannel.joinable) {
        msg.reply('I can\'t join this voice channel!')
        return
    }
    try {
        url = msg.content.split(" ")[1]
    } catch {
        msg.reply('Please enter a video url when using this command')
        return
    }
    switch (url.toLowerCase()) {
        case 'epic':
            url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2'
            break
        case 'magic':
            url = 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl'
            break
        case 'undertale':
            url = 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x'
            break
        case 'fun':
            url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD'
            break
        case 'bully':
            url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_'
            break
        case 'starwars':
            url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk'
            break
    }
    msg.channel.send('Boiling potatoes...')
    const output = await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        ignoreErrors: true,
        geoBypass: true,
        noPlaylist: true
    })
    if (!('queue' in guildStatus[msg.guild.id])) {
        guildStatus[msg.guild.id].queue = []
    }
    function addToQueue(entry) {
        if (entry.duration < 1200) {
            guildStatus[msg.guild.id].queue.push({
                'webpage_url': entry.webpage_url,
                'title': entry.title,
                'thumbnail': entry.thumbnails[0].url
            })
        } else {
            msg.reply(`${entry.title} is longer than 20 minutes and cannot be added to queue`)
            return
        }
    }
    if ('entries' in output) {
        for (const entry of output.entries) {
            addToQueue(entry)
        }
    } else {
        addToQueue(output)
    }
    if (!('audio' in guildStatus[msg.guild.id])) {
        guildStatus[msg.guild.id].audio = false
    }
    if (!guildStatus[msg.guild.id].audio) {
        playQueue(msg.channel, msg.guild, voiceChannel)
    }
}

async function setupEuchre(msg) {
    const player1 = await msg.guild.members.fetch({ query: msg.content.split(" ")[1], limit: 1 })
    const player2 = await msg.guild.members.fetch({ query: msg.content.split(" ")[2], limit: 1 })
    const player3 = await msg.guild.members.fetch({ query: msg.content.split(" ")[3], limit: 1 })
    const player4 = await msg.guild.members.fetch({ query: msg.content.split(" ")[4], limit: 1 })
    const players = genericEmbedResponse('Teams')
    players.addField('Team 1:', `${player1.first().user.username}, ${player3.first().user.username}`)
    players.addField('Team 2:', `${player2.first().user.username}, ${player4.first().user.username}`)
    msg.channel.send(players)
    const game = new Euchre([player1.first().user, player2.first().user, player3.first().user, player4.first().user])
    const results = await game.startGame()
    msg.channel.send(results)
}

// This block executes when a message is sent
client.on('message', msg => {

    // If message is not in a guild return
    if (!msg.guild) {
        return
    }

    // Creates a key in GuildStatus for the current guild
    if (!(msg.guild.id in guildStatus)) {
        guildStatus[msg.guild.id] = {}
        fs.mkdirSync(`${home}/Downloads/Bot Resources/temp/${msg.guild.id}`)
    }

    if (msg.author.bot) {

        // Disconnects rythm bot if it attempts to play a rickroll
        if (msg.content.indexOf('Never Gonna Give You Up') != -1) {
            msg.guild.members.fetch({ user: '235088799074484224' })
                .then(rythm => {
                    function kickRythm(count) {
                        if (rythm.voice.channelID) {
                            rythm.voice.kick()
                        } else if (count > 5) {
                            return
                        } else {
                            setTimeout(Rythm => kickRythm(count + 1), 2000)
                        }
                    }
                    kickRythm(0)
                })
                .catch(err => console.log(err))
        }
        return // Message is ignored if sent from a bot
    }

    // Checks if message contains swears or insults potatoes
    if (!msg.content.startsWith(prefix)) {
        const message = msg.content.toLowerCase()
        let mentionPotato = false
        let mentionSwear = false
        let mentionInsult = false
        if (message.indexOf('potato') != -1) {
            mentionPotato = true
        }
        for (const swear of sysData.blacklist.swears) {
            if (message.indexOf(swear) != -1) {
                mentionSwear = true
                break
            }
        }
        for (const insult of sysData.blacklist.insults) {
            if (message.indexOf(insult) != -1) {
                mentionInsult = true
                break
            }
        }
        if (mentionPotato && (mentionSwear || mentionInsult)) {
            msg.reply('FOOL! HOW DARE YOU BLASPHEMISE THE HOLY ORDER OF THE POTATOES! EAT POTATOES!', { 'tts': true })
            client.user.setActivity(`Teaching ${msg.author.tag} the value of potatoes`, {
                type: 'STREAMING',
                url: 'https://www.youtube.com/watch?v=fLNWeEen35Y'
            })
        } else if (mentionSwear) {
            for (let i = 0; i < 3; i++) {
                msg.channel.send('a')
            }
        }
        return
    }

    const msgBody = msg.content.split(" ")[0].slice(1).toLowerCase()

    try {

        // Determines which command was sent
        switch (msgBody) {
            case 'wynncraft':
                wynncraftStats(msg)
                break
            case 'newsong':
                newSwearSong(msg)
                break
            case 'download':
                download(msg)
                break
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
                }
                guildStatus[msg.guild.id].dispatcher.resume()
                msg.reply('Resumed!')
                break
            case 'queue':
                if (!('queue' in guildStatus[msg.guild.id]) || guildStatus[msg.guild.id].queue.length < 1) {
                    msg.reply('There is no queue!')
                    return
                }
                const queueMessage = genericEmbedResponse('Queue')
                for (const [i, entry] of guildStatus[msg.guild.id].queue.entries()) {
                    queueMessage.addField(`${i + 1}.`, `${entry.title}\n${entry.webpage_url}`)
                }
                msg.reply(queueMessage)
                break
            case 'clear':
                if (!('queue' in guildStatus[msg.guild.id]) || guildStatus[msg.guild.id].queue.length < 1) {
                    msg.reply('There is no queue!')
                    return
                }
                guildStatus[msg.guild.id].queue = []
                msg.reply('The queue has been cleared!')
                break
            case 'shuffle':
                if (!('queue' in guildStatus[msg.guild.id]) || guildStatus[msg.guild.id].queue.length < 1) {
                    msg.reply('There is no queue!')
                    return
                }
                guildStatus[msg.guild.id].queue.sort(() => Math.random() - 0.5)
                msg.reply('The queue has been shuffled')
                break
            case 'stop':
                if (!('dispatcher' in guildStatus[msg.guild.id])) {
                    msg.reply('There is nothing playing!')
                    return
                }
                if ('queue' in guildStatus[msg.guild.id]) {
                    guildStatus[msg.guild.id].queue = []
                }
                guildStatus[msg.guild.id].dispatcher.destroy()
                guildStatus[msg.guild.id].audio = false
                msg.reply('Success')
                break
            case 'np':
                if (!('nowPlaying' in guildStatus[msg.guild.id])) {
                    msg.reply('Nothing has played yet!')
                    return
                }
                msg.reply(guildStatus[msg.guild.id].nowPlaying)
                break
            case 'playlists':
                const playlists = genericEmbedResponse('Playlists')
                playlists.addField('Epic Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2')
                playlists.addField('Undertale Mix', 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x')
                playlists.addField('MTG Parodies', 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl')
                playlists.addField('Bully Maguire', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_')
                playlists.addField('Star Wars Parodies', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk')
                playlists.addField('Fun Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD')
                msg.reply(playlists)
                break
            case 'quote':
                const quotes = fs.readFileSync(`${home}/Downloads/Bot Resources/sys_files/quotes.txt`, 'utf8').split("}")
                msg.channel.send(quotes[Math.floor(Math.random() * quotes.length)], { 'tts': true })
                break
            case 'euchre':
                setupEuchre(msg)
                break
        }
    } catch (err) {
        console.log(err)
    }
})

client.login(sysData.potatoKey)