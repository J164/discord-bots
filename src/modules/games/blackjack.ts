import { type APIEmbed, ButtonStyle, ComponentType, type AttachmentPayload, type DMChannel } from 'discord.js';
import { CardRank } from '../../types/card.js';
import { EmbedType, messageOptions, responseEmbed } from '../../util/helpers.js';
import { type Card, Deck, multicardMessage } from '../../util/card-utils.js';

type Result = 'Bust' | 'Push' | 'Blackjack' | 'Win' | 'Lose';

export async function playBlackjack(channel: DMChannel): Promise<void> {
	const dealer = Deck.randomCards(2, {});
	const player = Deck.randomCards(2, {});

	const { embeds, files } = await printStandings(player, dealer);

	const prompt = async () => {
		const message = await channel.send(
			messageOptions({
				embeds,
				files,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								custom_id: 'hit',
								style: ButtonStyle.Primary,
								label: 'Hit',
							},
							{
								type: ComponentType.Button,
								custom_id: 'stand',
								style: ButtonStyle.Secondary,
								label: 'Stand',
							},
						],
					},
				],
			}),
		);
		let component;
		try {
			component = await message.awaitMessageComponent({
				componentType: ComponentType.Button,
				time: 300_000,
			});
		} catch {
			await message.edit(messageOptions({ components: [] }));
			return;
		}

		await component.update(messageOptions({ components: [] }));

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
		case 'Bust': {
			embed = responseEmbed(EmbedType.Info, 'Bust! (You went over 21)');
			break;
		}

		case 'Push': {
			embed = responseEmbed(EmbedType.Info, 'Push! (You tied with the dealer)');
			break;
		}

		case 'Blackjack': {
			embed = responseEmbed(EmbedType.Info, 'Blackjack!');
			break;
		}

		case 'Win': {
			embed = responseEmbed(EmbedType.Info, 'Win!');
			break;
		}

		case 'Lose': {
			embed = responseEmbed(EmbedType.Info, 'Lose!');
			break;
		}
	}

	const standings = await printStandings(player, dealer, true);
	standings.embeds.unshift(embed);

	const message = await channel.send(
		messageOptions({
			embeds: [...standings.embeds],
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							custom_id: 'continue',
							label: 'Play Again?',
							style: ButtonStyle.Primary,
						},
						{
							type: ComponentType.Button,
							custom_id: 'end',
							label: 'Cash Out',
							style: ButtonStyle.Secondary,
						},
					],
				},
			],
			files: standings.files,
		}),
	);

	let component;
	try {
		component = await message.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: 300_000,
		});
	} catch {
		await message.edit({ components: [] });
		return;
	}

	await component.update({ components: [] });

	if (component.customId === 'continue') {
		await playBlackjack(channel);
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

async function printStandings(player: Card[], dealer: Card[], gameEnd?: boolean): Promise<{ embeds: APIEmbed[]; files: AttachmentPayload[] }> {
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
