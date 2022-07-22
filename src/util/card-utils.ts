import { createCanvas, Image } from '@napi-rs/canvas';
import { APIEmbed, AttachmentPayload } from 'discord.js';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';

export type CardCode = `${'2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | 'J' | 'Q' | 'K' | 'A'}${'S' | 'C' | 'H' | 'D'}` | 'back';

export const enum CardSuit {
  Spades = 1,
  Clubs = 2,
  Hearts = 3,
  Diamonds = 4,
}

export const enum CardRank {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
}

export class Card {
  public readonly suit: CardSuit;
  public readonly rank: CardRank;

  public constructor(suit: CardSuit, rank: CardRank) {
    this.suit = suit;
    this.rank = rank;
  }

  public get cardCode(): CardCode {
    return `${this.rank > 10 || this.rank === CardRank.Ace ? this.rankName[0].toUpperCase() : this.rank === 10 ? '10' : this.rank.toString()}${
      this.suitName.toUpperCase()[0]
    }` as CardCode;
  }

  public get suitName(): string {
    switch (this.suit) {
      case CardSuit.Spades:
        return 'spades';
      case CardSuit.Clubs:
        return 'clubs';
      case CardSuit.Hearts:
        return 'hearts';
      case CardSuit.Diamonds:
        return 'diamonds';
    }
  }

  public get rankName(): string {
    switch (this.rank) {
      case CardRank.Ace:
        return 'ace';
      case CardRank.Two:
        return 'two';
      case CardRank.Three:
        return 'three';
      case CardRank.Four:
        return 'four';
      case CardRank.Five:
        return 'five';
      case CardRank.Six:
        return 'six';
      case CardRank.Seven:
        return 'seven';
      case CardRank.Eight:
        return 'eight';
      case CardRank.Nine:
        return 'nine';
      case CardRank.Ten:
        return 'ten';
      case CardRank.Jack:
        return 'jack';
      case CardRank.Queen:
        return 'queen';
      case CardRank.King:
        return 'king';
    }
  }

  public get image(): string {
    return `https://deckofcardsapi.com/static/img/${this.cardCode}.png`;
  }
}

export class Deck {
  private readonly _cards: Card[];

  public static randomCard(options: { suits?: CardSuit[]; ranks?: CardRank[] }): Card {
    options.suits ??= [1, 2, 3, 4];
    options.ranks ??= [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    return new Card(options.suits[Math.floor(Math.random() * 3)], options.ranks[Math.floor(Math.random() * 12)]);
  }

  public static randomCards(number: number, options: { suits?: CardSuit[]; ranks?: CardRank[] }): Card[] {
    const cards = [];
    for (let index = 0; index < number; index++) {
      cards.push(Deck.randomCard(options));
    }
    return cards;
  }

  public constructor(options: { suits?: CardSuit[]; ranks?: CardRank[] }) {
    this._cards = [];

    options.suits ??= [1, 2, 3, 4];
    options.ranks ??= [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    for (const suit of options.suits) {
      for (const rank of options.ranks) {
        this._cards.push(new Card(suit, rank));
      }
    }
  }

  public get size(): number {
    return this._cards.length;
  }

  public shuffle(): this {
    for (let index = this._cards.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [this._cards[index], this._cards[randomIndex]] = [this._cards[randomIndex], this._cards[index]];
    }
    return this;
  }

  public drawCard(): Card | null {
    return this._cards.pop() ?? null;
  }

  public drawCards(number: number): Card[] | null {
    if (number > this._cards.length) {
      return null;
    }
    return this._cards.splice(this._cards.length - number);
  }
}

function mergeImages(filePaths: string[]): Buffer {
  const activeCanvas = createCanvas(filePaths.length < 6 ? (filePaths.length % 6) * 226 : 1130, Math.ceil(filePaths.length / 5) * 314);
  const context = activeCanvas.getContext('2d');
  for (const [index, path] of filePaths.entries()) {
    const image = new Image();
    image.src = readFileSync(path);
    context.drawImage(image, (index % 5) * 226, Math.floor(index / 5) * 314);
  }
  return activeCanvas.toBuffer('image/png');
}

export function multicardMessage(cards: CardCode[], embed: APIEmbed): { embed: APIEmbed; file: AttachmentPayload } {
  const name = Date.now();
  const hand = { ...embed, image: { url: `attachment://${name}.png` } };
  if (cards.length === 1) {
    return {
      embed: hand,
      file: {
        attachment: readFileSync(`./assets/img/cards/${cards[0]}.png`),
        name: `${name}.png`,
      },
    };
  }
  return {
    embed: hand,
    file: {
      attachment: mergeImages(
        cards.map((card) => {
          return `./assets/img/cards/${card}.png`;
        }),
      ),
      name: `${name}.png`,
    },
  };
}
