import { MessageEmbed } from 'discord.js'
import { makeGetRequest, userData, findKey, genericEmbedResponse } from '../common'

interface DeckJson {
    image: string;
    name: string;
    url: string;
    apiUrl: string;
}

export class Deck {

    image: string
    name: string
    url: string
    apiUrl: string

    fill(json: DeckJson): void {
        this.image = json.image
        this.name = json.name
        this.url = json.url
        this.apiUrl = json.apiUrl
    }

    async getInfo(url: string): Promise<boolean> {
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

    getPreview(): MessageEmbed {
        const preview = genericEmbedResponse(this.name)
        preview.setImage(this.image)
        preview.addField('Deckstats URL:', this.url)
        return preview
    }

    async getList(): Promise<string> {
        const decklist = await makeGetRequest(this.apiUrl + 'list')
        const decklistArray = decklist.list.split('\n')
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