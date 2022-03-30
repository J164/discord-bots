import { DMChannel, FileOptions, Message, MessageEmbedOptions, MessageOptions } from 'discord.js';
import { buildEmbed } from '../../util/builders.js';
import { multicardMessage } from '../../util/card-utils.js';
import { Deck, Card } from '../../util/deck.js';

type Result = 'Bust' | 'Push' | 'Blackjack' | 'Win' | 'Lose';

export async function playBlackjack(channel: DMChannel): Promise<void> {
  const dealer = Deck.randomCard({
    number: 2,
    values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11],
  });
  const player = Deck.randomCard({
    number: 2,
    values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11],
  });

  const prompt = async () => {
    const message = await channel.send({
      ...printStandings(player, dealer),
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              type: 'BUTTON',
              customId: 'blackjack-hit',
              style: 'PRIMARY',
              label: 'Hit',
            },
            {
              type: 'BUTTON',
              customId: 'blackjack-stand',
              style: 'SECONDARY',
              label: 'Stand',
            },
          ],
        },
      ],
    });
    await new Promise<void>((resolve) => {
      channel
        .createMessageComponentCollector({
          filter: (b) => b.customId.startsWith('blackjack'),
          componentType: 'BUTTON',
          max: 1,
          time: 300_000,
        })
        .once('end', async (b) => {
          if (message.editable) await message.edit({ components: [] });
          if (!b.at(0)) return resolve();
          if (b.at(0).customId === 'blackjack-hit') {
            if (hit(player) === -1) {
              return resolve();
            }
            await prompt();
          }
          resolve();
        });
    });
  };
  await prompt();

  const finish = finishGame(player, dealer);
  const standings = printStandings(player, dealer, true);

  const standingsTemplate: MessageOptions = {
    embeds: [...standings.embeds],
    files: standings.files,
    components: [
      {
        type: 'ACTION_ROW',
        components: [
          {
            type: 'BUTTON',
            customId: 'blackjack-continue',
            label: 'Play Again?',
            style: 'PRIMARY',
          },
          {
            type: 'BUTTON',
            customId: 'blackjack-end',
            label: 'Cash Out',
            style: 'SECONDARY',
          },
        ],
      },
    ],
  };
  let message: Message;

  switch (finish) {
    case 'Bust':
      standingsTemplate.embeds.unshift(buildEmbed('info', { title: 'Bust! (You went over 21)' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Push':
      standingsTemplate.embeds.unshift(buildEmbed('info', { title: 'Push! (You tied with the dealer)' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Blackjack':
      standingsTemplate.embeds.unshift(buildEmbed('info', { title: 'Blackjack!' }), ...standings.embeds);
      message = await channel.send(standingsTemplate);
      break;
    case 'Win':
      standingsTemplate.embeds.unshift(buildEmbed('info', { title: 'Win!' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Lose':
      standingsTemplate.embeds.unshift(buildEmbed('info', { title: 'Lose!' }));
      message = await channel.send(standingsTemplate);
      break;
  }

  channel
    .createMessageComponentCollector({
      filter: (b) => b.customId.startsWith('blackjack'),
      componentType: 'BUTTON',
      max: 1,
      time: 300_000,
    })
    .once('end', async (b) => {
      await message.edit({ components: [] });
      if (!b.at(0)) return;
      if (b.at(0).customId === 'blackjack-continue') {
        void playBlackjack(channel);
      }
    });
}

function scoreHand(hand: Card[]): number {
  let numberAces = 0;
  let score = 0;
  for (const card of hand) {
    if (card.name === 'ace') {
      numberAces++;
    }
    score += card.value;
  }

  while (score > 21 && numberAces > 0) {
    numberAces--;
    score -= 10;
  }

  return score;
}

function hit(player: Card[]): number {
  player.push(
    Deck.randomCard({
      values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11],
    })[0],
  );
  const score = scoreHand(player);
  if (score > 21) return -1;
  return score;
}

function printStandings(player: Card[], dealer: Card[], gameEnd?: boolean): { embeds: MessageEmbedOptions[]; files: FileOptions[] } {
  const { embed: playerEmbed, file: playerFile } = multicardMessage(
    player,
    'info',
    {
      title: 'Player',
      fields: [{ name: 'Value:', value: scoreHand(player).toString(), inline: true }],
    },
    'player',
  );
  const { embed: dealerEmbed, file: dealerFile } = multicardMessage(
    gameEnd ? dealer : [dealer[0], { code: 'back' }],
    'info',
    {
      title: 'Dealer',
      fields: [
        {
          name: 'Value:',
          value: scoreHand(gameEnd ? dealer : [dealer[0]]).toString(),
          inline: true,
        },
      ],
    },
    'dealer',
  );
  return {
    embeds: [playerEmbed, dealerEmbed],
    files: [playerFile, dealerFile],
  };
}

function finishGame(player: Card[], dealer: Card[]): Result {
  while (scoreHand(dealer) < 17) {
    dealer.push(
      Deck.randomCard({
        values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11],
      })[0],
    );
  }

  const playerScore = scoreHand(player);
  const dealerScore = scoreHand(dealer);

  if (playerScore > 21) return 'Bust';

  if (playerScore === dealerScore) return 'Push';

  if (playerScore === 21) return 'Blackjack';

  if (playerScore > dealerScore || dealerScore > 21) return 'Win';

  return 'Lose';
}
