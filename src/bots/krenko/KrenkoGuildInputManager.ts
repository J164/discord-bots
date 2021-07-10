import { Client, Guild, Message, MessageEmbed, MessageReaction } from "discord.js";
import { writeFileSync } from "fs";
import { BaseGuildInputManager } from "../../core/BaseGuildInputManager";
import { findKey, genericEmbedResponse, home, makeGetRequest, refreshData, userData } from "../../core/common";

interface DeckJson {
    image: string;
    name: string;
    url: string;
    apiUrl: string;
}

class Deck {

    image: string
    name: string
    url: string
    apiUrl: string

    fill(json: DeckJson) {
        this.image = json.image
        this.name = json.name
        this.url = json.url
        this.apiUrl = json.apiUrl
    }

    async getInfo(url: string) {
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
            if (deck.name === deckJson.name) {
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
        const decklistArray = decklist.list.split("\n")
        for (let i = 0; i < decklistArray.length; i++) {
            if (!decklistArray[i] || decklistArray[i].startsWith('//')) {
                decklistArray.splice(i, 1)
                i--
                continue
            }
            if (decklistArray[i].indexOf('//') !== -1) {
                decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('//'))
            }
            if (decklistArray[i].indexOf('#') !== -1) {
                decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('#'))
            }
        }
        return '\n' + decklistArray.join('\n')
    }
}

export class KrenkoGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '$'
    
    public constructor(guild: Guild, client: Client) {
        super(guild, client)
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (!message.content.startsWith(KrenkoGuildInputManager.prefix) || message.author.bot || !message.guild) {
            return
        }

        return this.parseCommand(message)
    }

    private async parseCommand(message: Message): Promise<MessageEmbed | string> {
        switch (message.content.split(" ")[0].slice(1).toLowerCase()) {
            case 'add':
                return KrenkoGuildInputManager.add(message)
            case 'decks':
                this.decks(0, message)
                break
            case 'roll':
                return KrenkoGuildInputManager.roll(message)
            case 'flip':
                return KrenkoGuildInputManager.flip(message)
        }
    }

    private static async add(message: Message): Promise<string> {
        if (message.content.split(" ").length < 2) {
            return 'Please enter a deckstats URL!'
        }
        const deck = new Deck()
        if (!await deck.getInfo(message.content.split(" ")[1])) {
            return 'Something went wrong... (Make sure you are using a valid deck url from deckstats.net and that the deck is not a duplicate)'
        }
        refreshData()
        userData.decks.push(deck)
        const jsonString = JSON.stringify(userData)
        writeFileSync(`${home}/sys_files/bots.json`, jsonString)
        return 'Success!'
    }

    private async decks(i: number, message: Message): Promise<void> {
        const deck = new Deck()
        deck.fill(userData.decks[i])
        const menu = await message.channel.send(deck.getPreview())
        const emojiList = ['\uD83D\uDCC4', '\u274C']
        if (i !== 0) {
            emojiList.unshift('\u2B05\uFE0F')
        }
        if (i !== (userData.decks.length - 1)) {
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
            case '\uD83D\uDCC4':
                const deckList = await deck.getList()
                message.reply(deckList)
                menu.delete()
                return
            case '\u2B05\uFE0F':
                await menu.delete()
                this.decks(i - 1, message)
                return
            case '\u27A1\uFE0F':
                await menu.delete()
                this.decks(i + 1, message)
                return
            default:
                menu.delete()
                return
        }
    }

    private static roll(message: Message): MessageEmbed {
        let dice = 6
        if (message.content.split(" ").length > 1) {
            const arg = parseInt(message.content.split(" ")[1])
            if (!isNaN(arg) && arg > 0) {
                dice = arg
            }
        }
        message.channel.send(`Rolling a ${dice}-sided die...`)
        const diceResult = genericEmbedResponse(`${dice}-sided die result`)
        let chanceMod = 10000
        while ((100 / dice) * chanceMod < 1) {
            chanceMod *= 10
        }
        diceResult.addField(`${Math.floor((Math.random() * (dice - 1)) + 1)}`, `The chance of getting this result is about ${Math.round((100 / dice) * chanceMod) / chanceMod}%`)
        return diceResult
    }

    private static flip(message: Message): MessageEmbed {
        const flip = Math.random()
        const flipResult = genericEmbedResponse('Flip Result:')
        if (flip >= 0.5) {
            flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png')
        } else {
            flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png')
        }
        return flipResult
    }
}