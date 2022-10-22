import type { AttachmentPayload, DMChannel, EmbedBuilder } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import { CardRank } from '../../types/card.js';
import { EmbedType, responseEmbed } from '../../util/builders.js';
import type { Card } from '../../util/card-utils.js';
import { Deck, multicardMessage } from '../../util/card-utils.js';

type Result = 'Bust' | 'Push' | 'Blackjack' | 'Win' | 'Lose';

export async function playBlackjack(channel: DMChannel): Promise<void> {
	const dealer = Deck.randomCards(2, {});
	const player = Deck.randomCards(2, {});

	const prompt = async () => {
		const message = await channel.send({
			...(await printStandings(player, dealer)),
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

	let embed;
	switch (finish) {
		case 'Bust':
			embed = responseEmbed(EmbedType.Info, 'Bust! (You went over 21)');
			break;
		case 'Push':
			embed = responseEmbed(EmbedType.Info, 'Push! (You tied with the dealer)');
			break;
		case 'Blackjack':
			embed = responseEmbed(EmbedType.Info, 'Blackjack!');
			break;
		case 'Win':
			embed = responseEmbed(EmbedType.Info, 'Win!');
			break;
		case 'Lose':
			embed = responseEmbed(EmbedType.Info, 'Lose!');
			break;
	}

	const standings = await printStandings(player, dealer, true);
	standings.embeds.unshift(embed);

	const message = await channel.send({
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

	if (component.customId === 'continue') {
		void playBlackjack(channel);
	}
}

function scoreHand(hand: Card[]): number {
	let numberAces = 0;
	let score = 0;
	for (const card of hand) {
		if (card.rank === CardRank.Ace) {
			numberAces++;
			score += 11;
			continue;
		}

		if (card.rank > 10) {
			score += 10;
			continue;
		}

		score += card.rank;
	}

	while (score > 21 && numberAces > 0) {
		numberAces--;
		score -= 10;
	}

	return score;
}

function hit(player: Card[]): number {
	player.push(Deck.randomCard({}));
	const score = scoreHand(player);
	if (score > 21) return -1;
	return score;
}

async function printStandings(player: Card[], dealer: Card[], gameEnd?: boolean): Promise<{ embeds: EmbedBuilder[]; files: AttachmentPayload[] }> {
	const { embeds: playerEmbeds, files: playerFiles } = await multicardMessage(
		player,
		responseEmbed(EmbedType.Info, 'Player', {
			fields: [{ name: 'Value:', value: scoreHand(player).toString(), inline: true }],
		}),
	);
	const { embeds: dealerEmbeds, files: dealerFiles } = await multicardMessage(
		gameEnd ? dealer : [dealer[0], { image: 'https://deckofcardsapi.com/static/img/back.png' }],
		responseEmbed(EmbedType.Info, 'Dealer', {
			fields: [
				{
					name: 'Value:',
					value: scoreHand(gameEnd ? dealer : [dealer[0]]).toString(),
					inline: true,
				},
			],
		}),
	);
	return { embeds: [...playerEmbeds, ...dealerEmbeds], files: [...playerFiles, ...dealerFiles] };
}

function finishGame(player: Card[], dealer: Card[]): Result {
	while (scoreHand(dealer) < 17) {
		dealer.push(Deck.randomCard({}));
	}

	const playerScore = scoreHand(player);
	const dealerScore = scoreHand(dealer);

	if (playerScore > 21) return 'Bust';

	if (playerScore === dealerScore) return 'Push';

	if (playerScore === 21) return 'Blackjack';

	if (playerScore > dealerScore || dealerScore > 21) return 'Win';

	return 'Lose';
}
