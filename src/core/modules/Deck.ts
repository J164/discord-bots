import { MessageEmbed } from 'discord.js'
import { makeGetRequest, genericEmbedResponse } from '../commonFunctions'
import { DeckJson, DeckstatsResponse, DeckstatsListResponse, ScryfallResponse } from '../interfaces'

export class Deck {

    private image: string
    private name: string
    private url: string
    private apiUrl: string

    public fill(json: DeckJson): void {
        this.image = json.image
        this.name = json.name
        this.url = json.url
        this.apiUrl = json.api_url
    }

    public getName(): string {
        return this.name
    }

    public getImage(): string {
        return this.image
    }

    public getUrl(): string {
        return this.url
    }

    public getApiUrl(): string {
        return this.apiUrl
    }

    public async getInfo(url: string): Promise<boolean> {
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
            deckJson = <DeckstatsResponse> await makeGetRequest(this.apiUrl + 'json')
        } catch {
            return false
        }
        this.name = deckJson.name
        for (const section of deckJson.sections) {
            for (const card of section.cards) {
                if (card.isCommander) {
                    const cardInfo = <ScryfallResponse> await makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(card.name)}`)
                    this.image = cardInfo.data[0].image_uris.large
                    return true
                }
            }
        }
        return false
    }

    public getPreview(): MessageEmbed {
        const preview = genericEmbedResponse(this.name)
        preview.setImage(this.image)
        preview.addField('Deckstats URL:', this.url)
        return preview
    }

    public async getList(): Promise<string> {
        const decklist = <DeckstatsListResponse> await makeGetRequest(this.apiUrl + 'list')
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