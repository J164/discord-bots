import { createCanvas, Image } from '@napi-rs/canvas';
import { APIEmbed, AttachmentPayload } from 'discord.js';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { CardCode } from './deck.js';

type SuitId = 1 | 2 | 3 | 4
type RankId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

class Card {
  public readonly suit: SuitId
  public readonly rank: RankId

  public constructor(suit: SuitId, rank: RankId) {
    this.suit = suit
    this.rank = rank
  }

  public get suitName(): string {
    switch (this.suit) {
      case 1:
        return 'spades'
      case 2:
        return 'clubs'
      case 3:
        return 'diamonds'
      case 4:
        return 'hearts'
    }
  }

  public get rankName(): string {
    switch (this.rank) {
      case 1:
        return 'ace'
      case 2:
        return 'two'
      case 3:
        return 'three'
    }
  }
}

class Deck {

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

export function multicardMessage(name: string, cards: { code: CardCode | 'back' }[], embed: APIEmbed): { embed: APIEmbed; file: AttachmentPayload } {
  const hand = { ...embed, image: { url: `attachment://${name}.png` } };
  if (cards.length === 1) {
    return {
      embed: hand,
      file: {
        attachment: readFileSync(`./assets/img/cards/${cards[0].code}.png`),
        name: `${name}.png`,
      },
    };
  }
  return {
    embed: hand,
    file: {
      attachment: mergeImages(
        cards.map((card) => {
          return `./assets/img/cards/${card.code}.png`;
        }),
      ),
      name: `${name}.png`,
    },
  };
}
