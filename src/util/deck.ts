export type Suit = 'Hearts' | 'Diamonds' | 'Spades' | 'Clubs';
export type CardCode = `${'2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | 'J' | 'Q' | 'K' | 'A'}${'S' | 'C' | 'H' | 'D'}`;
export type CardName =
  | 'one'
  | 'two'
  | 'three'
  | 'four'
  | 'five'
  | 'six'
  | 'seven'
  | 'eight'
  | 'nine'
  | 'ten'
  | 'jack'
  | 'queen'
  | 'king'
  | 'ace';

export interface Card {
  readonly code: CardCode;
  readonly suit: Suit;
  readonly value: number;
  readonly name: CardName;
  readonly image: string;
}

export class Deck {
  private readonly _stack: Card[];
  private static readonly _fullDeck: readonly CardCode[] = [
    '2S',
    '3S',
    '4S',
    '5S',
    '6S',
    '7S',
    '8S',
    '9S',
    '0S',
    'JS',
    'QS',
    'KS',
    'AS',
    '2C',
    '3C',
    '4C',
    '5C',
    '6C',
    '7C',
    '8C',
    '9C',
    '0C',
    'JC',
    'QC',
    'KC',
    'AC',
    '2H',
    '3H',
    '4H',
    '5H',
    '6H',
    '7H',
    '8H',
    '9H',
    '0H',
    'JH',
    'QH',
    'KH',
    'AH',
    '2D',
    '3D',
    '4D',
    '5D',
    '6D',
    '7D',
    '8D',
    '9D',
    '0D',
    'JD',
    'QD',
    'KD',
    'AD',
  ];

  public static randomCard(options: { number?: number; noRepeats?: boolean; codes?: CardCode[]; values?: number[] }): Card[] {
    options.codes ??= [...Deck._fullDeck];
    const cards: Card[] = [];
    for (let index = 0; index < (options.number ?? 1); index++) {
      const random = Math.floor(Math.random() * options.codes.length);
      cards.push(Deck.parseCode(options.noRepeats ? options.codes.splice(random, 1)[0] : options.codes[random], options.values));
    }
    return cards;
  }

  // eslint-disable-next-line complexity
  private static parseCode(code: CardCode, values?: number[]): Card {
    if (!code) return;
    values ??= [];

    let value: number;
    let name: CardName;
    switch (code[0]) {
      case '2':
        value = values[0] ?? 2;
        name = 'two';
        break;
      case '3':
        value = values[1] ?? 3;
        name = 'three';
        break;
      case '4':
        value = values[2] ?? 4;
        name = 'four';
        break;
      case '5':
        value = values[3] ?? 5;
        name = 'five';
        break;
      case '6':
        value = values[4] ?? 6;
        name = 'six';
        break;
      case '7':
        value = values[5] ?? 7;
        name = 'seven';
        break;
      case '8':
        value = values[6] ?? 8;
        name = 'eight';
        break;
      case '9':
        value = values[7] ?? 9;
        name = 'nine';
        break;
      case '0':
        value = values[8] ?? 10;
        name = 'ten';
        break;
      case 'J':
        value = values[9] ?? 11;
        name = 'jack';
        break;
      case 'Q':
        value = values[10] ?? 12;
        name = 'queen';
        break;
      case 'K':
        value = values[11] ?? 13;
        name = 'king';
        break;
      case 'A':
        value = values[12] ?? 14;
        name = 'ace';
        break;
    }

    let suit: Suit;
    switch (code[1]) {
      case 'S':
        suit = 'Spades';
        break;
      case 'C':
        suit = 'Clubs';
        break;
      case 'D':
        suit = 'Diamonds';
        break;
      case 'H':
        suit = 'Hearts';
        break;
    }
    return {
      code: code,
      image: `https://deckofcardsapi.com/static/img/${code}.png`,
      suit: suit,
      value: value,
      name: name,
    };
  }

  public constructor(options: { codes?: readonly CardCode[]; values?: number[] }) {
    options.codes ??= Deck._fullDeck;
    this._stack = [];
    for (const code of options.codes) {
      this._stack.push(Deck.parseCode(code, options.values));
    }
  }

  public shuffle(): this {
    for (let index = this._stack.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temporary = this._stack[index];
      this._stack[index] = this._stack[randomIndex];
      this._stack[randomIndex] = temporary;
    }
    return this;
  }

  public draw(number: number): Card[] {
    return this._stack.splice(0, number);
  }
}
