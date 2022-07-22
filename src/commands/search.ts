import { createCanvas, Image } from '@napi-rs/canvas';
import { ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { Buffer } from 'node:buffer';
import { ChatCommand, GlobalChatCommandInfo } from '../index.js';
import { Emojis, responseEmbed, responseOptions } from '../util/builders.js';

interface MagicCard {
  readonly name: string;
  readonly uri: string;
  readonly image_uris?: {
    readonly large: string;
  };
  readonly card_faces?: readonly {
    readonly image_uris: {
      readonly large: string;
    };
  }[];
  readonly prices: {
    readonly usd: string;
  };
}

interface ScryfallResponse {
  readonly status?: string;
  readonly data: MagicCard[];
}

async function mergeImages(remotePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
  const activeCanvas = createCanvas(options.width, options.height);
  const context = activeCanvas.getContext('2d');
  for (const [index, path] of remotePaths.entries()) {
    const image = new Image();
    image.src = Buffer.from(await (await fetch(path)).arrayBuffer());
    context.drawImage(image, index * (options.width / remotePaths.length), 0);
  }
  return activeCanvas.toBuffer('image/png');
}

function formatResponse(response: ScryfallResponse): MagicCard[][] {
  const cards: MagicCard[][] = [];
  for (let r = 0; r < Math.ceil(response.data.length / 5); r++) {
    cards.push([]);
    for (let index = 0; index < 5; index++) {
      if (r * 5 + index > response.data.length - 1) {
        break;
      }
      cards[r].push(response.data[r * 5 + index]);
    }
  }
  return cards;
}

async function generateResponse(results: MagicCard[][], r: number, index: number): Promise<InteractionUpdateOptions> {
  const card = results[r][index];
  if (card.card_faces) {
    return {
      embeds: [
        responseEmbed('info', {
          title: card.name,
          footer: {
            text: `Price ($): ${card.prices.usd}` ?? 'unknown (not for sale)',
          },
          image: { url: 'attachment://card.png' },
        }),
      ],
      files: [
        {
          attachment: await mergeImages([card.card_faces[0].image_uris.large, card.card_faces[1].image_uris.large], {
            width: 1344,
            height: 936,
          }),
          name: 'card.png',
        },
      ],
      components: [],
    };
  }
  return {
    embeds: [
      responseEmbed('info', {
        title: card.name,
        footer: {
          text: `Price ($): ${card.prices.usd}` ?? 'unknown (not for sale)',
        },
        image: card.image_uris?.large ? { url: card.image_uris.large } : undefined,
      }),
    ],
    components: [],
  };
}

function response(info: GlobalChatCommandInfo, results: MagicCard[][], page: number): InteractionUpdateOptions & InteractionReplyOptions {
  void prompt(info, results, page);
  return {
    embeds: [
      responseEmbed('info', {
        title: 'Results',
        footer: { text: `${page + 1}/${results.length}` },
        fields: results[page].map((entry, index) => {
          return {
            name: `${index + 1}.`,
            value: `${entry.name}`,
          };
        }),
      }),
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.SelectMenu,
            customId: 'options',
            placeholder: 'Select a Card',
            options: results[page].map((value, index) => {
              return {
                label: (index + 1).toString(),
                description: value.name,
                value: (index + 1).toString(),
              };
            }),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: 'jumpleft',
            emoji: Emojis.DoubleArrowLeft,
            label: 'Return to Beginning',
            style: ButtonStyle.Secondary,
            disabled: page === 0,
          },
          {
            type: ComponentType.Button,
            customId: 'left',
            emoji: Emojis.ArrowLeft,
            label: 'Previous Page',
            style: ButtonStyle.Secondary,
            disabled: page === 0,
          },
          {
            type: ComponentType.Button,
            customId: 'right',
            emoji: Emojis.ArrowRight,
            label: 'Next Page',
            style: ButtonStyle.Secondary,
            disabled: page === results.length - 1,
          },
          {
            type: ComponentType.Button,
            customId: 'jumpright',
            emoji: Emojis.DoubleArrowRight,
            label: 'Jump to End',
            style: ButtonStyle.Secondary,
            disabled: page === results.length - 1,
          },
        ],
      },
    ],
  };
}

async function prompt(info: GlobalChatCommandInfo, results: MagicCard[][], page: number): Promise<void> {
  let component;
  try {
    component = await info.response.awaitMessageComponent({
      filter: (b) => b.user.id === info.response.interaction.user.id,
      time: 300_000,
    });
  } catch {
    void info.response.interaction.editReply({ components: [] });
    return;
  }

  if (component.isSelectMenu()) {
    void component.update(await generateResponse(results, page, Number.parseInt(component.values[0]) - 1));
    return;
  }
  switch (component.customId) {
    case 'jumpleft':
      void component.update(response(info, results, 0));
      break;
    case 'left':
      void component.update(response(info, results, page - 1));
      break;
    case 'right':
      void component.update(response(info, results, page + 1));
      break;
    case 'jumpright':
      void component.update(response(info, results, results.length - 1));
      break;
  }
}

async function search(info: GlobalChatCommandInfo): Promise<void> {
  const searchTerm = info.response.interaction.options.getString('query', true);
  let results;
  try {
    results = formatResponse((await (await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`)).json()) as ScryfallResponse);
  } catch {
    void info.response.interaction.editReply(
      responseOptions('error', {
        title: 'Card Not Found',
        fields: [
          {
            name: `${searchTerm} not found`,
            value: 'Check your spelling and/or try using a more general search term',
          },
        ],
      }),
    );
    return;
  }
  void info.response.interaction.editReply(response(info, results, 0));
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'search',
    description: 'Search for Magic cards',
    options: [
      {
        name: 'query',
        description: 'What to search for',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  respond: search,
  ephemeral: true,
  type: 'Global',
};
