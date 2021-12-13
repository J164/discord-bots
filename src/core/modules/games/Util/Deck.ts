export type Suit = 'Hearts' | 'Diamonds' | 'Spades' | 'Clubs'
export type CardCode = '2S' | '3S' | '4S' | '5S' | '6S' | '7S' | '8S' | '9S' | '0S' | 'JS' | 'QS' | 'KS' | 'AS' | '2C' | '3C' | '4C' | '5C' | '6C' | '7C' | '8C' | '9C' | '0C' | 'JC' | 'QC' | 'KC' | 'AC' | '2H' | '3H' | '4H' | '5H' | '6H' | '7H' | '8H' | '9H' | '0H' | 'JH' | 'QH' | 'KH' | 'AH' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D' | '8D' | '9D' | '0D' | 'JD' | 'QD' | 'KD' | 'AD'

export interface Card {
    readonly code: CardCode;
    readonly suit: Suit;
    readonly value: string;
    readonly image: string;
}

export class Deck {

    private readonly stack: Card[]

    public constructor(codes?: CardCode[]) {
        codes ??= [ '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '0S', 'JS', 'QS', 'KS', 'AS', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '0C', 'JC', 'QC', 'KC', 'AC', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '0H', 'JH', 'QH', 'KH', 'AH', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '0D', 'JD', 'QD', 'KD', 'AD' ]
        this.stack = []
        for (const code of codes) {
            const num = parseInt(code[0])
            let value: string
            if (isNaN(num)) {
                switch(code[0]) {
                    case 'J':
                        value = 'Jack'
                        break
                    case 'Q':
                        value = 'Queen'
                        break
                    case 'K':
                        value = 'King'
                        break
                    case 'A':
                        value = 'Ace'
                        break
                }
            } else {
                value = num.toString()
            }

            let suit: Suit
            switch(code[1]) {
                case 'S':
                    suit = 'Spades'
                    break
                case 'C':
                    suit = 'Clubs'
                    break
                case 'D':
                    suit = 'Diamonds'
                    break
                case 'H':
                    suit = 'Hearts'
                    break
            }

            this.stack.push({ code: code, image: `https://deckofcardsapi.com/static/img/${code}.png`, suit: suit, value: value })
        }
    }

    public shuffle(): void {
        for (let i = this.stack.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1))
            const temp = this.stack[i]
            this.stack[i] = this.stack[randomIndex]
            this.stack[randomIndex] = temp
        }
    }

    public draw(number: number): Card[] {
        const draws: Card[] = []
        for (let i = 0; i < number; i ++) {
            draws.push(this.stack.shift())
        }
        return draws
    }
}