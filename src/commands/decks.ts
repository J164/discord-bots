import { ButtonInteraction, InteractionUpdateOptions } from 'discord.js';
import { request } from 'undici';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommandInfo, GlobalChatCommand } from '../util/interfaces.js';

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

interface DeckstatsResponse {
  readonly name: string;
  readonly sections: readonly {
    readonly cards: readonly {
      readonly name: string;
      readonly isCommander: boolean;
    }[];
  }[];
}

async function parseDeck(info: GlobalChatCommandInfo, urls: { url: string }[], button?: ButtonInteraction, index = 0): Promise<void> {
  const url = urls[index].url;
  const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(url);
  const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
  const results = (await (await request(`${apiUrl}json`)).body.json()) as DeckstatsResponse;
  let image: string;
  for (const section of results.sections) {
    const commander = section.cards.findIndex((card) => card.isCommander);
    if (commander !== -1) {
      const cardInfo = (await (
        await request(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(section.cards[commander].name)}`)
      ).body.json()) as ScryfallResponse;
      image = cardInfo.data[0].image_uris.large;
    }
  }
  const options: InteractionUpdateOptions = {
    embeds: [
      buildEmbed('info', {
        title: results.name,
        image: { url: image },
        fields: [{ name: 'Deckstats URL:', value: url }],
        footer: { text: `${index + 1}/${urls.length}` },
      }),
    ],
    components: [
      {
        type: 'ACTION_ROW',
        components: [
          {
            type: 'BUTTON',
            customId: 'decks-doublearrowleft',
            emoji: '\u23EA',
            label: 'Return to Beginning',
            style: 'SECONDARY',
            disabled: index === 0,
          },
          {
            type: 'BUTTON',
            customId: 'decks-arrowleft',
            emoji: '\u2B05\uFE0F',
            label: 'Previous Page',
            style: 'SECONDARY',
            disabled: index === 0,
          },
          {
            type: 'BUTTON',
            customId: 'decks-list',
            emoji: '\uD83D\uDCC4',
            label: 'Decklist',
            style: 'PRIMARY',
          },
          {
            type: 'BUTTON',
            customId: 'decks-arrowright',
            emoji: '\u27A1\uFE0F',
            label: 'Next Page',
            style: 'SECONDARY',
            disabled: index === urls.length - 1,
          },
          {
            type: 'BUTTON',
            customId: 'decks-doublearrowright',
            emoji: '\u23E9',
            label: 'Jump to End',
            style: 'SECONDARY',
            disabled: index === urls.length - 1,
          },
        ],
      },
    ],
  };
  await (!button ? info.interaction.editReply(options) : button.update(options));
  info.interaction.channel
    .createMessageComponentCollector({
      filter: (b) => b.user.id === info.interaction.user.id && b.customId.startsWith(info.interaction.commandName),
      time: 300_000,
      componentType: 'BUTTON',
      max: 1,
    })
    .once('end', async (b) => {
      await info.interaction.editReply({ components: [] }).catch();
      if (!b.at(0)) return;
      switch (b.at(0).customId) {
        case 'decks-doublearrowleft':
          void parseDeck(info, urls, b.at(0));
          break;
        case 'decks-arrowleft':
          void parseDeck(info, urls, b.at(0), index - 1);
          break;
        case 'decks-list':
          b.at(0)
            .update({
              content: ((await (await request(`${apiUrl}list`)).body.json()) as { list: string }).list.match(/^([^\n!#/]+)/gm).join('\n'),
              embeds: [],
              components: [],
            })
            .catch(() => {
              void b.at(0).update({
                embeds: [
                  buildEmbed('error', {
                    title: 'There seems to be something wrong with the Deckstats API at the moment. Try again later',
                  }),
                ],
                components: [],
              });
            });
          break;
        case 'decks-arrowright':
          void parseDeck(info, urls, b.at(0), index + 1);
          break;
        case 'decks-doublearrowright':
          void parseDeck(info, urls, b.at(0), urls.length - 1);
          break;
      }
    });
}

async function getDeck(info: GlobalChatCommandInfo): Promise<undefined> {
  void parseDeck(info, (await info.database.findMany('mtg_decks')) as unknown as { url: string }[]);
  return undefined;
}

export const command: GlobalChatCommand = {
  data: {
    name: 'decks',
    description: "Get a deck from Potato's database",
  },
  respond: getDeck,
  ephemeral: true,
  type: 'Global',
};
