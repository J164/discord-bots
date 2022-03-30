import { InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommandInfo, GlobalChatCommand } from '../util/interfaces.js';

async function addDeck(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(
    info.interaction.options.getString('url'),
  );

  if (!ids) {
    return {
      embeds: [
        buildEmbed('error', {
          title: 'Please use a deck url from deckstats',
        }),
      ],
    };
  }

  if (await info.database.findOne('mtg_decks', { url: info.interaction.options.getString('url') }))
    return {
      embeds: [
        buildEmbed('error', {
          title: "Failed! (Make sure the deck isn't a duplicate)",
        }),
      ],
    };

  const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
  let name: string;
  try {
    name = ((await (await request(`${apiUrl}json`)).body.json()) as { name: string }).name;
  } catch {
    return {
      embeds: [
        buildEmbed('error', {
          title: 'Please use a deck url from deckstats',
        }),
      ],
    };
  }
  await info.database.insertOne('mtg_decks', {
    url: info.interaction.options.getString('url'),
  });
  return {
    embeds: [
      buildEmbed('success', {
        title: `Success! Deck "${name}" has been added!`,
      }),
    ],
  };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'adddeck',
    description: "Add a deck to Potato's database",
    options: [
      {
        name: 'url',
        description: 'Deckstats URL for the new deck',
        type: 3,
        required: true,
      },
    ],
  },
  respond: addDeck,
  type: 'Global',
};
