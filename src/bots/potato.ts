import * as Discord from 'discord.js'
import * as fs from 'fs'
import * as axios from 'axios'
import * as EventEmitter from 'events'
import { Euchre } from '../core/games/Euchre'
import { genericEmbedResponse, getUser, makeGetRequest, voiceKick, home, userData, refreshData, sysData, root } from '../core/common'
const youtubedl = require('youtube-dl-exec')

const intents: Discord.BitFieldResolvable<Discord.IntentsString> = ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS']
let client: Discord.Client = new Discord.Client({ ws: { intents: intents} })
const prefix = '&'
const users: { admin: Discord.User; swear: Discord.User } = { admin: null, swear: null }
let guildStatus: { [key: string]: GuildData } = {}

interface GuildData {
    queue?: QueueItem[];
    downloadQueue?: QueueItem[];
    downloading: boolean;
    audio: boolean;
    voice?: Discord.VoiceConnection;
    nowPlaying?: Discord.MessageEmbed;
    fullLoop: boolean;
    singleLoop: boolean;
    dispatcher?: Discord.StreamDispatcher;
}

class QueueItem extends EventEmitter {
    webpageUrl: string
    title: string
    id: string
    thumbnail: string
    duration: number
    downloading: boolean

    constructor(webpageUrl: string, title: string, id: string, thumbnail: string, duration: number) {
        super()
        this.webpageUrl = webpageUrl
        this.title = title
        this.id = id
        this.thumbnail = thumbnail
        this.duration = duration
        this.downloading = false
    }

    isDownloaded(): boolean {
        if (fs.existsSync(`${home}/music_files/playback/${this.id}.json`)) {
            return true
        }
        if (!this.downloading) {
            this.download()
        }
        return false
    }

    async download(): Promise<void> {
        this.downloading = true
        const output = await youtubedl(this.webpageUrl, {
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            ignoreErrors: true,
            geoBypass: true,
            printJson: true,
            format: 'bestaudio',
            output: `${home}/music_files/playback/%(id)s.mp3`
        })
        this.thumbnail = output.thumbnails[0].url
        const metaData = JSON.stringify({
            webpageUrl: this.webpageUrl,
            title: this.title,
            id: this.id,
            thumbnail: this.thumbnail,
            duration: this.duration
        })
        fs.writeFileSync(`${home}/music_files/playback/${this.id}.json`, metaData)
        this.emit('downloaded')
    }
}

async function connect(channel: Discord.PartialTextBasedChannelFields, guildID: Discord.Snowflake, vc: Discord.VoiceChannel): Promise<void> {
    if (!vc.joinable || guildStatus[guildID].queue.length < 1) {
        channel.send('Something went wrong!')
        guildStatus[guildID].queue = []
        return
    }
    guildStatus[guildID].audio = true
    guildStatus[guildID].voice = await vc.join()
    checkSongStatus(channel, guildID, vc)
}

async function checkSongStatus(channel: Discord.PartialTextBasedChannelFields, guildID: Discord.Snowflake, vc: Discord.VoiceChannel): Promise<void> {
    if (guildStatus[guildID].queue.length < 1) {
        guildStatus[guildID].audio = false
        guildStatus[guildID].singleLoop = false
        guildStatus[guildID].fullLoop = false
        return
    }
    const currentSong = guildStatus[guildID].queue.shift()
    if (!currentSong.isDownloaded()) {
        currentSong.once("downloaded", () => {
            playSong(channel, guildID, vc, currentSong)
        })
        return
    }
    playSong(channel, guildID, vc, currentSong)
}

async function playSong(channel: Discord.PartialTextBasedChannelFields, guildID: Discord.Snowflake, vc: Discord.VoiceChannel, song: QueueItem): Promise<void> {
    guildStatus[guildID].dispatcher = guildStatus[guildID].voice.play(`${home}/music_files/playback/${song.id}.mp3`)
    guildStatus[guildID].nowPlaying = genericEmbedResponse(`Now Playing: ${song.title}`)
    guildStatus[guildID].nowPlaying.setImage(song.thumbnail)
    guildStatus[guildID].nowPlaying.addField('URL:', song.webpageUrl)
    if (!guildStatus[guildID].singleLoop) {
        channel.send(guildStatus[guildID].nowPlaying)
    }
    guildStatus[guildID].dispatcher.once('finish', () => {
        if (guildStatus[guildID].fullLoop) {
            guildStatus[guildID].queue.push(song)
        } else if (guildStatus[guildID].singleLoop) {
            guildStatus[guildID].queue.unshift(song)
        }
        guildStatus[guildID].dispatcher.destroy()
        guildStatus[guildID].audio = false
        checkSongStatus(channel, guildID, vc)
    })
}

async function download(guildID: Discord.Snowflake): Promise<void> {
    while (guildStatus[guildID].downloadQueue.length > 0) {
        console.log('time to download')
        guildStatus[guildID].downloading = true
        const currentItem = guildStatus[guildID].downloadQueue.shift()
        await currentItem.download()
    }
    guildStatus[guildID].downloading = false
}

async function wynncraftStats(msg: Discord.Message): Promise<void> {
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

async function newSwearSong(msg: Discord.Message): Promise<void> {
    if (msg.author !== users.admin && msg.author !== users.swear) {
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
    if (!output) {
        msg.reply('It appears the video was unavailable')
        return
    }
    if ('entries' in output) {
        msg.reply('Please only enter a single video at a time')
        return
    }
    if (output.duration > 1200) {
        msg.reply('The video length limit is 20 minutes! Aborting...')
        return
    }
    msg.channel.send('Downloading...')
    youtubedl(msg.content.split(" ")[1], {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/music_files/swear_songs/song${userData.swearSongs.length + 1}.mp3`
    })
    refreshData()
    userData.swearSongs.push(`song${(userData.swearSongs.length + 1)}.mp3`)
    const jsonString = JSON.stringify(userData)
    fs.writeFileSync(`${home}/sys_files/bots.json`, jsonString)
    msg.reply('Success!')
}

async function downloadVideo(msg: Discord.Message): Promise<void> {
    if (msg.author !== users.admin) {
        msg.reply('You don\'t have permission to use this command!')
        return
    }
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a video url')
        return
    }
    const options = {
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        format: 'bestaudio',
        output: `${home}/New Downloads/%(title)s.%(ext)s`,
        ignoreErrors: true
    }
    if (msg.content.split(" ").length < 3 || msg.content.split(" ")[2][0].toLowerCase() !== 'a') {
        options.format = 'bestvideo,bestaudio'
    }
    msg.channel.send('Downloading...')
    await youtubedl(msg.content.split(" ")[1], options)
    msg.reply('Download Successful!')
}

async function search(parameter: string): Promise<string> {
    const searchResult = await axios.default.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&order=relevance&q=${encodeURIComponent(parameter)}&type=video&videoDefinition=high&key=${sysData.googleKey}`)
    if (searchResult.data.pageInfo.totalResults < 1) {
        return null
    }
    return searchResult.data.items[0].id.videoId
}

async function play(msg: Discord.Message): Promise<void> {
    let term: string
    const voiceChannel = msg.member.voice.channel
    if (!voiceChannel?.joinable) {
        msg.reply('This command can only be used while in a visable voice channel!')
        return
    }
    try {
        term = msg.content.split(" ")[1]
    } catch {
        msg.reply('Please enter a video url or search terms when using this command')
        return
    }
    switch (term.toLowerCase()) {
        case 'epic':
            term = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2'
            break
        case 'magic':
            term = 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl'
            break
        case 'undertale':
            term = 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x'
            break
        case 'fun':
            term = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD'
            break
        case 'bully':
            term = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_'
            break
        case 'starwars':
            term = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk'
            break
    }
    msg.channel.send('Boiling potatoes...')
    let url: string
    if (term.indexOf('youtube.com/') === -1) {
        const arg = msg.content.split(" ")
        arg.shift()
        url = `https://www.youtube.com/watch?v=${await search(arg.join(" "))}`
        if (!url) {
            msg.reply(`No results found for '${term}'`)
            return
        }
    } else {
        url = term
    }
    let output
    if (url.split(/[?&]+/)[1].startsWith('list') || !fs.existsSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`)) {
        try {
            output = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noCallHome: true,
                noCheckCertificate: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true,
                ignoreErrors: true,
                geoBypass: true,
                noPlaylist: true,
                flatPlaylist: true
            })
        } catch (err) {
            console.log(err)
            msg.reply('Please enter a valid url')
            return
        }
    } else {
        output = JSON.parse(fs.readFileSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`, { encoding: 'utf8' }))
    }
    function addToQueue(duration: number, webpageUrl: string, title: string, id: string, thumbnail: string) {
        if (duration < 5400) {
            const song = new QueueItem(webpageUrl, title, id, thumbnail, duration)
            guildStatus[msg.guild.id].queue.push(song)
            if (!thumbnail) {
                guildStatus[msg.guild.id].downloadQueue.push(song)
                if (!guildStatus[msg.guild.id].downloading) {
                    download(msg.guild.id)
                }
            }
            return
        }
        msg.reply(`${title} is longer than 90 minutes and cannot be added to queue`);
    }
    if ('entries' in output) {
        for (const entry of output.entries) {
            let data
            if (fs.existsSync(`${home}/music_files/playback/${entry.id}.json`)) {
                data = JSON.parse(fs.readFileSync(`${home}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }))
            } else {
                data = entry
            }
            addToQueue(data.duration, `https://www.youtube.com/watch?v=${data.id}`, data.title, data.id, data?.thumbnail)
        }
    } else {
        addToQueue(output.duration, output.webpage_url, output.title, output.id, output?.thumbnail)
    }
    msg.reply('Added to queue!')
    if (!guildStatus[msg.guild.id].audio) {
        guildStatus[msg.guild.id].singleLoop = false
        guildStatus[msg.guild.id].fullLoop = false
        connect(msg.channel, msg.guild.id, voiceChannel)
    }
}

async function displayQueue(msg: Discord.Message): Promise<void> {
    if (guildStatus[msg.guild.id].queue.length < 1) {
        msg.reply('There is no queue!')
        return
    }
    const queueArray: QueueItem[][] = []
    for (let r = 0; r < Math.ceil(guildStatus[msg.guild.id].queue.length / 25); r++) {
        queueArray.push([])
        for (let i = 0; i < 25; i++) {
            if ((r * 25) + i > guildStatus[msg.guild.id].queue.length - 1) {
                break
            }
            queueArray[r].push(guildStatus[msg.guild.id].queue[(r * 25) + i])
        }
    }
    async function sendQueue(index: number): Promise<null> {
        const queueMessage = genericEmbedResponse('Queue')
        for (const [i, entry] of queueArray[index].entries()) {
            queueMessage.addField(`${i + 1}.`, `${entry.title}\n${entry.webpageUrl}`)
        }
        if (guildStatus[msg.guild.id].fullLoop) {
            queueMessage.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png')
        }
        const message = await msg.channel.send(queueMessage)
        const emojiList = ['\u274C']
        if (index > 0) {
            emojiList.unshift('\u2B05\uFE0F')
        }
        if (index < queueArray.length - 1) {
            emojiList.push('\u27A1\uFE0F')
        }
        for (const emoji of emojiList) {
            await message.react(emoji)
        }
        function filter(reaction: Discord.MessageReaction): boolean { return reaction.client === client }
        const reactionCollection = await message.awaitReactions(filter, { max: 1 })
        const reactionResult = reactionCollection.first()
        switch (reactionResult.emoji.name) {
            case '\u2B05\uFE0F':
                await message.delete()
                sendQueue(index - 1)
                break
            case '\u27A1\uFE0F':
                await message.delete()
                sendQueue(index + 1)
                break
            default:
                message.delete()
                return
        }
    }
    sendQueue(0)
}

async function setupEuchre(msg: Discord.Message): Promise<void> {
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

function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`)
        process.send('start')

        client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)])

        getUser('619975185029922817', '609826125501169723', client)
            .then(admin => { users.admin = admin.user })

        getUser('619975185029922817', '633046187506794527', client)
            .then(swear => { users.swear = swear.user })

        setInterval(function () {
            client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)])

            for (const guild in guildStatus) {
                if (!guildStatus[guild].audio && guildStatus[guild].voice) {
                    guildStatus[guild].voice.disconnect()
                }
            }
        }, 60000)
    })

    client.on('voiceStateUpdate', (oldState, newState) => {
        if (oldState.id !== client.user.id) {
            return
        }
        if (oldState.channelID && oldState.channelID !== newState.channelID && guildStatus[oldState.guild.id]?.dispatcher) {
            guildStatus[oldState.guild.id].audio = false
            guildStatus[oldState.guild.id].singleLoop = false
            guildStatus[oldState.guild.id].fullLoop = false
        }
    })

    client.on('message', msg => {
        if (!msg.guild) {
            return
        }

        if (!(msg.guild.id in guildStatus)) {
            guildStatus[msg.guild.id] = {
                audio: false,
                dispatcher: null,
                queue: [],
                downloadQueue: [],
                voice: null,
                downloading: false,
                nowPlaying: null,
                fullLoop: false,
                singleLoop: false
            }
        }

        if (msg.author.bot) {
            if (msg.content.indexOf('Never Gonna Give You Up') !== -1) {
                voiceKick(0, msg.member.voice)
            }
            return
        }

        if (!msg.content.startsWith(prefix)) {
            let mentionPotato = false
            let mentionSwear = false
            let mentionInsult = false
            for (const word of msg.content.toLowerCase().split(" ")) {
                if (word.indexOf('potato') !== -1) {
                    mentionPotato = true
                }
                for (const swear of sysData.blacklist.swears) {
                    if (word === swear) {
                        mentionSwear = true
                        break
                    }
                }
                for (const insult of sysData.blacklist.insults) {
                    if (word === insult) {
                        mentionInsult = true
                        break
                    }
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
            switch (msgBody) {
                case 'wynncraft':
                    wynncraftStats(msg)
                    break
                case 'newsong':
                    newSwearSong(msg)
                    break
                case 'download':
                    downloadVideo(msg)
                    break
                case 'play':
                    play(msg)
                    break
                case 'pause':
                    if (!guildStatus[msg.guild.id].dispatcher) {
                        msg.reply('Nothing is playing!')
                        return
                    }
                    guildStatus[msg.guild.id].dispatcher.pause(true)
                    msg.reply('Paused!')
                    break
                case 'resume':
                    if (!guildStatus[msg.guild.id].dispatcher) {
                        msg.reply('Nothing is playing!')
                    }
                    guildStatus[msg.guild.id].dispatcher.resume()
                    msg.reply('Resumed!')
                    break
                case 'loop':
                    if (!guildStatus[msg.guild.id].nowPlaying) {
                        msg.reply('Nothing is playing!')
                        return
                    }
                    if (guildStatus[msg.guild.id].singleLoop) {
                        guildStatus[msg.guild.id].singleLoop = false
                        guildStatus[msg.guild.id].nowPlaying.setFooter('')
                        msg.reply('No longer looping')
                        return
                    }
                    guildStatus[msg.guild.id].singleLoop = true
                    guildStatus[msg.guild.id].fullLoop = false
                    guildStatus[msg.guild.id].nowPlaying.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png')
                    msg.reply('Now looping!')
                    break
                case 'loopqueue':
                    if (guildStatus[msg.guild.id].queue.length < 1) {
                        msg.reply('There is no queue to loop!')
                        return
                    }
                    if (guildStatus[msg.guild.id].fullLoop) {
                        guildStatus[msg.guild.id].fullLoop = false
                        msg.reply('No longer looping queue')
                        return
                    }
                    guildStatus[msg.guild.id].fullLoop = true
                    guildStatus[msg.guild.id].singleLoop = false
                    msg.reply('Now looping queue!')
                    break
                case 'queue':
                    displayQueue(msg)
                    break
                case 'clear':
                    if (guildStatus[msg.guild.id].queue.length < 1) {
                        msg.reply('There is no queue!')
                        return
                    }
                    guildStatus[msg.guild.id].queue = []
                    guildStatus[msg.guild.id].fullLoop = false
                    msg.reply('The queue has been cleared!')
                    break
                case 'skip':
                    if (!guildStatus[msg.guild.id].audio) {
                        msg.reply('There is nothing to skip')
                        return
                    }
                    guildStatus[msg.guild.id].dispatcher.destroy()
                    guildStatus[msg.guild.id].singleLoop = false
                    checkSongStatus(msg.channel, msg.guild.id, guildStatus[msg.guild.id].voice.channel)
                    msg.reply('Skipped!')
                    break
                case 'shuffle': //change to shuffle option when adding to queue (async downloading is easier)
                    if (guildStatus[msg.guild.id].queue.length < 1) {
                        msg.reply('There is no queue!')
                        return
                    }
                    guildStatus[msg.guild.id].queue.sort(() => Math.random() - 0.5)
                    msg.reply('The queue has been shuffled')
                    break
                case 'stop':
                    if (!guildStatus[msg.guild.id].dispatcher) {
                        msg.reply('There is nothing playing!')
                        return
                    }
                    guildStatus[msg.guild.id].queue = []
                    guildStatus[msg.guild.id].downloadQueue = []
                    guildStatus[msg.guild.id].dispatcher.destroy()
                    guildStatus[msg.guild.id].audio = false
                    guildStatus[msg.guild.id].singleLoop = false
                    guildStatus[msg.guild.id].fullLoop = false
                    guildStatus[msg.guild.id].voice.disconnect()
                    msg.reply('Success')
                    break
                case 'np':
                    if (!guildStatus[msg.guild.id].nowPlaying) {
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
                    const quotes = fs.readFileSync(`${root}/assets/static/quotes.txt`, 'utf8').split("}")
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
}

process.on("message", function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log('Potato Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Discord.Client({ ws: { intents: intents } })
            guildStatus = {}
            defineEvents()
            client.login(sysData.potatoKey)
            break
    }
})

process.send('ready')