import { FileOptions, MessageEmbedOptions } from 'discord.js';
import { buildEmbed } from './builders.js';
import { CardCode } from './deck.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';

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

export function multicardMessage(
  cards: { code: CardCode | 'back' }[],
  embedType: 'info' | 'prompt',
  embedOptions: MessageEmbedOptions,
  fileName: string,
): { embed: MessageEmbedOptions; file: FileOptions } {
  const hand = buildEmbed(embedType, {
    ...embedOptions,
    image: { url: `attachment://${fileName}.png` },
  });
  if (cards.length === 1) {
    return {
      embed: hand,
      file: {
        attachment: readFileSync(`./assets/img/cards/${cards[0].code}.png`),
        name: `${fileName}.png`,
      },
    };
  }
  const filePaths: string[] = [];
  for (const card of cards) {
    filePaths.push(`./assets/img/cards/${card.code}.png`);
  }
  return {
    embed: hand,
    file: { attachment: mergeImages(filePaths), name: `${fileName}.png` },
  };
}
