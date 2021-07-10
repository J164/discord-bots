import { Guild, Client, Message, MessageEmbed, MessageReaction } from 'discord.js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { genericEmbedResponse, home, makeGetRequest, refreshData, root, searchYoutube, sysData, userData, voiceKick } from '../../core/common'
import { Euchre } from '../../core/games/Euchre'
import { QueueItem, PotatoVoiceManager } from './PotatoVoiceManager'
const youtubedl = require('youtube-dl-exec')

export class PotatoGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '&'
    public readonly voiceManager: PotatoVoiceManager

    public constructor(guild: Guild, client: Client) {
        super(guild, client)
        this.voiceManager = new PotatoVoiceManager()
        this.getUsers()
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (!message.guild) {
            return
        }

        if (message.author.bot) {
            if (message.content.indexOf('Never Gonna Give You Up') !== -1) {
                voiceKick(0, message.member.voice)
            }
            return
        }

        if (!message.content.startsWith(PotatoGuildInputManager.prefix)) {
            return this.genericMessageParse(message)
        }

        return this.parseCommand(message)
    }

    private genericMessageParse(message: Message): void {
        let mentionPotato = false
        let mentionSwear = false
        let mentionInsult = false
        const input = message.content.toLowerCase()
        if (input.match(/(\W|^)potato(s|es)?(\W|$)/)) {
            mentionPotato = true
        }
        for (const swear of sysData.blacklist.swears) {
            if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
                mentionSwear = true
                break
            }
        }
        for (const insult of sysData.blacklist.insults) {
            if (input.match(new RegExp(`(\\W|^)${insult}(\\W|$)`))) {
                mentionInsult = true
                break
            }
        }
        if (mentionPotato && (mentionSwear || mentionInsult)) {
            message.reply('FOOL! HOW DARE YOU BLASPHEMISE THE HOLY ORDER OF THE POTATOES! EAT POTATOES!', { 'tts': true })
            this.client.user.setActivity(`Teaching ${message.author.tag} the value of potatoes`, {
                type: 'STREAMING',
                url: 'https://www.youtube.com/watch?v=fLNWeEen35Y'
            })
            return
        }
        if (mentionSwear) {
            for (let i = 0; i < 3; i++) {
                message.channel.send('a')
            }
        }
    }

    private async parseCommand(message: Message): Promise<MessageEmbed | string> {
        switch (message.content.split(' ')[0].slice(1).toLowerCase()) {
            case 'wynncraft':
                return PotatoGuildInputManager.getWynncraftStats(message)
            case 'newsong':
                return this.addSwearSong(message)
            case 'download':
                return this.downloadVideo(message)
            case 'play':
                return this.play(message)
            case 'pause':
                if (this.voiceManager.pause()) {
                    return 'Paused!'
                }
                return 'Nothing is playing!'
            case 'resume':
                if (this.voiceManager.resume()) {
                    return 'Resumed!'
                }
                return 'Nothing is playing!'
            case 'loop':
                return this.voiceManager.loopSong()
            case 'loopqueue':
                return this.voiceManager.loopQueue()
            case 'queue':
                this.queue(0, message)
                break
            case 'clear':
                if (this.voiceManager.clear()) {
                    return 'The queue has been cleared'
                }
                return 'There is no queue!'
            case 'skip':
                if (this.voiceManager.skip()) {
                    return 'Skipped'
                }
                return 'There is nothing to skip!'
            case 'shuffle':
                if (this.voiceManager.shuffleQueue()) {
                    return 'The queue has been shuffled'
                }
                return 'There is nothing to shuffle!'
            case 'stop':
                this.voiceManager.reset()
                return 'Success'
            case 'np':
                return this.voiceManager.getNowPlaying()
            case 'playlists':
                return genericEmbedResponse('Playlists')
                    .addField('Epic Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2')
                    .addField('Undertale Mix', 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x')
                    .addField('MTG Parodies', 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl')
                    .addField('Bully Maguire', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_')
                    .addField('Star Wars Parodies', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk')
                    .addField('Fun Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD')
            case 'quote':
                // eslint-disable-next-line no-case-declarations
                const quotes = readFileSync(`${root}/assets/static/quotes.txt`, 'utf8').split('}')
                return quotes[Math.floor(Math.random() * quotes.length)]
            case 'euchre':
                return PotatoGuildInputManager.setupEuchre(message)
            default:
                return 'Command not recognized'
        }
    }

    private static async getWynncraftStats(message: Message): Promise<MessageEmbed | string> {
        if (message.content.split(' ').length < 2) {
            return 'Please enter a player username!'
        }
        const data = await makeGetRequest(`https://api.wynncraft.com/v2/player/${message.content.split(' ')[1]}/stats`)
        let status
        const embedVar = new MessageEmbed()
        embedVar.setTitle(data.data[0].username)
        if (data.data[0].meta.location.online) {
            status = `Online at: ${data.data[0].meta.location.server}`
            embedVar.setColor(0x33cc33)
        } else {
            status = 'Offline'
            embedVar.setColor(0xff0000)
        }
        embedVar.addField('Current Status', status)
        for (let i = 0; i < data.data[0].classes.length; i++) {
            let playtime = data.data[0].classes[i].playtime
            const playHours = Math.floor(playtime / 60)
            playtime = playtime % 60
            let playtimeString
            let playHoursString
            if (playtime < 10) {
                playtimeString = `0${playtime}`
            } else {
                playtimeString = playtime.toString()
            }
            if (playHours < 10) {
                playHoursString = `0${playHours}`
            } else {
                playHoursString = playHours.toString()
            }
            embedVar.addField(`Profile ${i + 1}`, `Class: ${data.data[0].classes[i].name}\nPlaytime: ${playHoursString}:${playtimeString}\nCombat Level: ${data.data[0].classes[i].professions.combat.level}`)
        }
        return embedVar
    }

    private async addSwearSong(message: Message): Promise<string> {
        if (message.member !== this.users.get('admin') && message.member !== this.users.get('swear')) {
            return 'You don\'t have permission to use this command!'
        }
        if (message.content.split(' ').length < 2) {
            return 'Please enter a video url'
        }
        message.channel.send('Getting information on new song...')
        const output = await youtubedl(message.content.split(' ')[1], {
            dumpJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            ignoreErrors: true
        })
        if (!output) {
            return 'It appears the video was unavailable'
        }
        if ('entries' in output) {
            return 'Please only enter a single video at a time'
        }
        if (output.duration > 1200) {
            return 'The video length limit is 20 minutes! Aborting...'
        }
        message.channel.send('Downloading...')
        youtubedl(message.content.split(' ')[1], {
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            format: 'bestaudio',
            output: `${home}/music_files/swear_songs/song${userData.swearSongs.length + 1}.mp3`
        })
        refreshData()
        userData.swearSongs.push(`song${userData.swearSongs.length + 1}.mp3`)
        const jsonString = JSON.stringify(userData)
        writeFileSync(`${home}/sys_files/bots.json`, jsonString)
        return 'Success!'
    }

    private async downloadVideo(message: Message): Promise<string> {
        if (message.member !== this.users.get('admin')) {
            return 'You don\'t have permission to use this command!'
        }
        if (message.content.split(' ').length < 2) {
            return 'Please enter a video url'
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
        if (message.content.split(' ').length < 3 || message.content.split(' ')[2][0].toLowerCase() !== 'a') {
            options.format = 'bestvideo,bestaudio'
        }
        message.channel.send('Downloading...')
        await youtubedl(message.content.split(' ')[1], options)
        return 'Download Successful!'
    }

    private async play(message: Message): Promise<string> {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel?.joinable) {
            return 'This command can only be used while in a visable voice channel!'
        }
        if (message.content.split(' ').length < 2) {
            return 'Please enter a video url or search terms when using this command'
        }
        let url = message.content.split(' ')[1]
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
            default:
                break
        }
        message.channel.send('Boiling potatoes...')
        if (!url.match(/(\.|^)youtube\.com\//)) {
            const arg = message.content.split(' ')
            arg.shift()
            const term = await searchYoutube(arg.join(' '))
            if (!term) {
                return `No results found for '${arg.join(' ')}'`
            }
            url = `https://www.youtube.com/watch?v=${term}`
        }
        let output
        if (url.split(/[?&]+/)[1].startsWith('list') || !existsSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`)) {
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
                return 'Please enter a valid url'
            }
        } else {
            output = JSON.parse(readFileSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`, { encoding: 'utf8' }))
        }
        if ('entries' in output) {
            for (const entry of output.entries) {
                let data
                if (existsSync(`${home}/music_files/playback/${entry.id}.json`)) {
                    data = JSON.parse(readFileSync(`${home}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }))
                } else {
                    data = entry
                }
                this.voiceManager.addToQueue(data.duration, `https://www.youtube.com/watch?v=${data.id}`, data.title, data.id, data?.thumbnail)
            }
        } else {
            this.voiceManager.addToQueue(output.duration, output.webpage_url, output.title, output.id, output?.thumbnail)
        }
        this.voiceManager.connect(voiceChannel, message.channel)
        return 'Added to queue!'
    }

    private async queue(index: number, message: Message, queueArray: QueueItem[][] = null): Promise<void> {
        if (!queueArray) {
            queueArray = this.voiceManager.getQueue()
            if (!queueArray) {
                message.reply('There is no queue!')
                return
            }
        }
        const queueMessage = genericEmbedResponse('Queue')
        for (const [ i, entry ] of queueArray[index].entries()) {
            queueMessage.addField(`${i + 1}.`, `${entry.title}\n${entry.webpageUrl}`)
        }
        if (this.voiceManager.getQueueLoop()) {
            queueMessage.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png')
        }
        const menu = await message.channel.send(queueMessage)
        const emojiList = [ '\u274C' ]
        if (index > 0) {
            emojiList.unshift('\u2B05\uFE0F')
        }
        if (index < queueArray.length - 1) {
            emojiList.push('\u27A1\uFE0F')
        }
        for (const emoji of emojiList) {
            await menu.react(emoji)
        }
        const client = this.client
        function filter(reaction: MessageReaction): boolean { return reaction.client === client }
        const reactionCollection = await menu.awaitReactions(filter, { max: 1 })
        const reactionResult = reactionCollection.first()
        switch (reactionResult.emoji.name) {
            case '\u2B05\uFE0F':
                await menu.delete()
                this.queue(index - 1, message, queueArray)
                break
            case '\u27A1\uFE0F':
                await menu.delete()
                this.queue(index + 1, message, queueArray)
                break
            default:
                menu.delete()
                break
        }
    }

    private static async setupEuchre(message: Message): Promise<MessageEmbed> {
        const player1 = await message.guild.members.fetch({ query: message.content.split(' ')[1], limit: 1 })
        const player2 = await message.guild.members.fetch({ query: message.content.split(' ')[2], limit: 1 })
        const player3 = await message.guild.members.fetch({ query: message.content.split(' ')[3], limit: 1 })
        const player4 = await message.guild.members.fetch({ query: message.content.split(' ')[4], limit: 1 })
        const players = genericEmbedResponse('Teams')
        players.addField('Team 1:', `${player1.first().user.username}, ${player3.first().user.username}`)
        players.addField('Team 2:', `${player2.first().user.username}, ${player4.first().user.username}`)
        message.channel.send(players)
        const game = new Euchre([ player1.first().user, player2.first().user, player3.first().user, player4.first().user ])
        return game.startGame()
    }
}