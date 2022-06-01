import { ButtonStyle, ComponentType, InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { ChatCommand, GlobalChatCommandInfo } from '../potato-client.js';
import { Emojis, responseEmbed } from '../util/builders.js';

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

async function response(info: GlobalChatCommandInfo, urls: { url: string }[], index: number): Promise<InteractionUpdateOptions & InteractionReplyOptions> {
  const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(urls[index].url)!;
  const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
  const results = (await (await fetch(`${apiUrl}json`)).json()) as DeckstatsResponse;
  let image: string | undefined;
  for (const section of results.sections) {
    const commander = section.cards.findIndex((card) => card.isCommander);
    if (commander !== -1) {
      const cardInfo = (await (
        await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(section.cards[commander].name)}`)
      ).json()) as ScryfallResponse;
      image = cardInfo.data[0].image_uris?.large;
    }
  }
  void prompt(info, urls, index);
  return {
    embeds: [
      responseEmbed('info', {
        title: results.name,
        image: image ? { url: image } : undefined,
        fields: [{ name: 'Deckstats URL:', value: urls[index].url }],
        footer: { text: `${index + 1}/${urls.length}` },
      }),
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: 'jumpleft',
            emoji: Emojis.DoubleArrowLeft,
            label: 'Return to Beginning',
            style: ButtonStyle.Secondary,
            disabled: index === 0,
          },
          {
            type: ComponentType.Button,
            customId: 'left',
            emoji: Emojis.ArrowLeft,
            label: 'Previous Page',
            style: ButtonStyle.Secondary,
            disabled: index === 0,
          },
          {
            type: ComponentType.Button,
            customId: 'list',
            emoji: Emojis.Document,
            label: 'Decklist',
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: 'right',
            emoji: Emojis.ArrowRight,
            label: 'Next Page',
            style: ButtonStyle.Secondary,
            disabled: index === urls.length - 1,
          },
          {
            type: ComponentType.Button,
            customId: 'jumpright',
            emoji: Emojis.DoubleArrowRight,
            label: 'Jump to End',
            style: ButtonStyle.Secondary,
            disabled: index === urls.length - 1,
          },
        ],
      },
    ],
  };
}

async function prompt(info: GlobalChatCommandInfo, urls: { url: string }[], index: number) {
  let component;
  try {
    component = await info.response.awaitMessageComponent({
      filter: (b) => b.user.id === info.response.interaction.user.id,
      time: 300_000,
      componentType: ComponentType.Button,
    });
  } catch {
    void info.response.interaction.editReply({ components: [] }).catch();
    return;
  }

  switch (component.customId) {
    case 'jumpleft':
      await component.update(await response(info, urls, 0));
      break;
    case 'left':
      await component.update(await response(info, urls, index - 1));
      break;
    case 'list':
      try {
        const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(urls[index].url)!;
        const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
        await component.update({
          content: ((await (await fetch(`${apiUrl}list`)).json()) as { list: string }).list.match(/^([^\n!#/]+)/gm)?.join('\n'),
          embeds: [],
          components: [],
        });
      } catch {
        void component.update({
          embeds: [
            responseEmbed('error', {
              title: 'Something went wrong. Please try again later',
            }),
          ],
          components: [],
        });
      }
      return;
    case 'right':
      await component.update(await response(info, urls, index + 1));
      break;
    case 'jumpright':
      await component.update(await response(info, urls, urls.length - 1));
      break;
  }
}

async function getDeck(info: GlobalChatCommandInfo): Promise<void> {
  const urls = (await info.database.collection('mtg_decks').find({}).toArray()) as unknown as { url: string }[];
  void info.response.interaction.editReply(await response(info, urls, 0));
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'decks',
    description: "Get a deck from Potato's database",
  },
  respond: getDeck,
  ephemeral: true,
  type: 'Global',
};
