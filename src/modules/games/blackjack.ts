import { APIEmbed, AttachmentPayload, ButtonStyle, ComponentType, DMChannel, Message, MessageOptions } from 'discord.js';
import { responseEmbed } from '../../util/builders.js';
import { multicardMessage } from '../../util/card-utils.js';
import { Card, Deck } from '../../util/deck.js';

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
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              customId: 'hit',
              style: ButtonStyle.Primary,
              label: 'Hit',
            },
            {
              type: ComponentType.Button,
              customId: 'stand',
              style: ButtonStyle.Secondary,
              label: 'Stand',
            },
          ],
        },
      ],
    });
    let component;
    try {
      component = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 300_000,
      });
    } catch {
      void message.edit({ components: [] }).catch();
      return;
    }
    await component.update({ components: [] });

    if (component.customId === 'hit') {
      if (hit(player) === -1) {
        return;
      }
      await prompt();
    }
  };
  await prompt();

  const finish = finishGame(player, dealer);
  const standings = printStandings(player, dealer, true);

  const standingsTemplate: MessageOptions = {
    embeds: [...standings.embeds],
    files: standings.files,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: 'continue',
            label: 'Play Again?',
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: 'end',
            label: 'Cash Out',
            style: ButtonStyle.Secondary,
          },
        ],
      },
    ],
  };
  let message: Message;

  switch (finish) {
    case 'Bust':
      standingsTemplate.embeds!.unshift(responseEmbed('info', { title: 'Bust! (You went over 21)' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Push':
      standingsTemplate.embeds!.unshift(responseEmbed('info', { title: 'Push! (You tied with the dealer)' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Blackjack':
      standingsTemplate.embeds!.unshift(responseEmbed('info', { title: 'Blackjack!' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Win':
      standingsTemplate.embeds!.unshift(responseEmbed('info', { title: 'Win!' }));
      message = await channel.send(standingsTemplate);
      break;
    case 'Lose':
      standingsTemplate.embeds!.unshift(responseEmbed('info', { title: 'Lose!' }));
      message = await channel.send(standingsTemplate);
      break;
  }

  let component;
  try {
    component = await message.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 300_000,
    });
  } catch {
    void message.edit({ components: [] }).catch();
    return;
  }
  await component.update({ components: [] });

  if (component.customId === 'continue') {
    void playBlackjack(channel);
  }
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

function printStandings(player: Card[], dealer: Card[], gameEnd?: boolean): { embeds: APIEmbed[]; files: AttachmentPayload[] } {
  const { embed: playerEmbed, file: playerFile } = multicardMessage(
    'player',
    player,
    responseEmbed('info', {
      title: 'Player',
      fields: [{ name: 'Value:', value: scoreHand(player).toString(), inline: true }],
    }),
  );
  const { embed: dealerEmbed, file: dealerFile } = multicardMessage(
    'dealer',
    gameEnd ? dealer : [dealer[0], { code: 'back' }],
    responseEmbed('info', {
      title: 'Dealer',
      fields: [
        {
          name: 'Value:',
          value: scoreHand(gameEnd ? dealer : [dealer[0]]).toString(),
          inline: true,
        },
      ],
    }),
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
