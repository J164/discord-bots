import { setTimeout } from 'node:timers';
import type { APISelectMenuOption, ButtonBuilder, ButtonInteraction, SelectMenuInteraction, ThreadChannel, User, SelectMenuBuilder } from 'discord.js';
import { ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { CardRank, CardSuit } from '../../types/card.js';
import type { EuchrePlayer, EuchreTeam, GameInfo } from '../../types/games.js';
import { EmbedType, messageOptions, responseEmbed, responseOptions } from '../../util/builders.js';
import type { Card } from '../../util/card-utils.js';
import { Deck, multicardMessage } from '../../util/card-utils.js';

export function playEuchre(playerlist: User[], gameChannel: ThreadChannel): void {
	const team1: EuchreTeam = { tricks: 0, score: 0, name: 'Team 1' };
	const team2: EuchreTeam = { tricks: 0, score: 0, name: 'Team 2' };
	void startRound({
		team1,
		team2,
		players: [
			{
				team: team1,
				user: playerlist[0],
				hand: [],
				out: false,
			},
			{
				team: team2,
				user: playerlist[1],
				hand: [],
				out: false,
			},
			{
				team: team1,
				user: playerlist[2],
				hand: [],
				out: false,
			},
			{
				team: team2,
				user: playerlist[3],
				hand: [],
				out: false,
			},
		],
		gameChannel,
	});
}

async function startRound(gameInfo: GameInfo): Promise<void> {
	await gameInfo.gameChannel.send(
		responseOptions(EmbedType.Info, 'Player Order', {
			fields: [
				{
					name: `1. ${gameInfo.players[0].user.username}`,
					value: gameInfo.players[0].team.name,
				},
				{
					name: `2. ${gameInfo.players[1].user.username}`,
					value: gameInfo.players[1].team.name,
				},
				{
					name: `3. ${gameInfo.players[2].user.username}`,
					value: gameInfo.players[2].team.name,
				},
				{
					name: `4. ${gameInfo.players[3].user.username}`,
					value: gameInfo.players[3].team.name,
				},
			],
		}),
	);
	const draws = new Deck({ ranks: [1, 9, 10, 11, 12, 13] }).shuffle();
	for (const player of gameInfo.players) {
		for (let r = 0; r < 5; r++) {
			player.hand.push(draws.drawCard()!);
		}
	}

	const top = draws.drawCard()!;

	const sendHand = async (player: EuchrePlayer) => {
		const channel = await player.user.createDM();
		const { embeds, files } = await multicardMessage(player.hand, responseEmbed(EmbedType.Info, 'Your Hand:'));
		await channel.send(messageOptions({ embeds, files, components: [] }));
	};

	await Promise.all(
		gameInfo.players.map(async (player) => {
			return sendHand(player);
		}),
	);

	const { embeds, files } = await multicardMessage([top], responseEmbed(EmbedType.Info, 'Top of Stack:'));
	await gameInfo.gameChannel.send(messageOptions({ embeds, files, components: [] }));

	const promptThree = async (index: number): Promise<void> => {
		const dm = await gameInfo.players[index].user.createDM();
		const message = await dm.send(
			messageOptions({
				embeds: [responseEmbed(EmbedType.Prompt, 'Would you like to go alone?')],
				components: [
					new ActionRowBuilder<ButtonBuilder>({
						components: [
							{
								type: ComponentType.Button,
								customId: 'yes',
								label: 'Yes',
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: 'no',
								label: 'No',
								style: ButtonStyle.Secondary,
							},
						],
					}),
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
			await message.edit(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [] }));

			gameInfo.players.find((player) => player.team === gameInfo.players[index].team && !player.user.equals(gameInfo.players[index].user))!.out = true;
			return round({ gameInfo, leader: index, solo: true });
		}

		await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [] }));

		if (component.customId === 'yes') {
			gameInfo.players.find((player) => player.team === gameInfo.players[index].team && !player.user.equals(gameInfo.players[index].user))!.out = true;
			return round({ gameInfo, leader: index, solo: true });
		}

		void round({ gameInfo, leader: index, solo: false });
	};

	const promptTwo = async (index = 0): Promise<void> => {
		const { embeds, files } = await multicardMessage(
			gameInfo.players[index].hand,
			responseEmbed(EmbedType.Info, index === 3 ? 'Please select trump' : 'Would you like to pass or select trump?'),
		);
		const dm = await gameInfo.players[index].user.createDM();
		const message = await dm.send(
			messageOptions({
				embeds,
				files,
				components: [
					new ActionRowBuilder<SelectMenuBuilder>({
						components: [
							{
								type: ComponentType.SelectMenu,
								customId: 'suit',
								placeholder: 'Select a Suit',
								options: [
									{
										label: 'Spades',
										value: '1',
										emoji: '\u2660\uFE0F',
									},
									{
										label: 'Clubs',
										value: '2',
										emoji: '\u2663\uFE0F',
									},
									{
										label: 'Hearts',
										value: '3',
										emoji: '\u2665\uFE0F',
									},
									{
										label: 'Diamonds',
										value: '4',
										emoji: '\u2666\uFE0F',
									},
								],
							},
							{
								type: ComponentType.Button,
								customId: 'pass',
								label: 'Pass',
								style: ButtonStyle.Secondary,
								disabled: index === 3,
							},
						],
					}),
				],
			}),
		);
		let component;
		try {
			component = (await message.awaitMessageComponent({
				time: 300_000,
			})) as ButtonInteraction | SelectMenuInteraction;
		} catch {
			await message.edit(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [], files: [] }));

			if (index === 3) {
				gameInfo.trump = 0 as CardSuit;
				void promptThree(index);
				return;
			}

			return promptTwo(index + 1);
		}

		await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [], files: [] }));

		if (component.isSelectMenu()) {
			gameInfo.trump = Number.parseInt(component.values[0], 10) as CardSuit;
			void promptThree(index);
			return;
		}

		return promptTwo(index + 1);
	};

	const promptReplace = async (index: number): Promise<void> => {
		const dm = await gameInfo.players[3].user.createDM();
		const { embeds, files } = await multicardMessage(gameInfo.players[3].hand, responseEmbed(EmbedType.Info, 'Select a card to replace'));
		const message = await dm.send(
			messageOptions({
				embeds,
				files,
				components: [
					new ActionRowBuilder<SelectMenuBuilder>({
						components: [
							{
								type: ComponentType.SelectMenu,
								customId: 'replace',
								placeholder: 'Select a Card',
								options: gameInfo.players[3].hand.map((card, index) => {
									return {
										label: `${card.rankName} of ${card.suitName}`,
										value: index.toString(),
									};
								}),
							},
						],
					}),
				],
			}),
		);
		let position;
		try {
			const component = await message.awaitMessageComponent({
				componentType: ComponentType.SelectMenu,
				time: 300_000,
			});
			position = Number.parseInt(component.values[0], 10);

			await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [], files: [] }));
		} catch {
			await message.edit(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [], files: [] }));
			position = 0;
		}

		gameInfo.players[3].hand.splice(position, 1, top);
		gameInfo.trump = top.suit;
		void promptThree(index);
	};

	const promptOne = async (index = 0): Promise<void> => {
		const dm = await gameInfo.players[index].user.createDM();
		const message = await dm.send(
			messageOptions({
				embeds: [
					responseEmbed(
						EmbedType.Prompt,
						index === 3 ? `Would you like to pass or pick it up?` : `Would you like to pass or have ${gameInfo.players[3].user.username} pick it up?`,
						{
							image: { url: top.image },
						},
					),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>({
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: 'pickup',
								label: 'Pick It Up',
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: 'pass',
								label: 'Pass',
								style: ButtonStyle.Primary,
							},
						],
					}),
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
			await message.edit(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [] }));

			if (index === 3) {
				return promptTwo();
			}

			return promptOne(index + 1);
		}

		await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [] }));

		if (component.customId === 'pass') {
			if (index === 3) {
				return promptTwo();
			}

			return promptOne(index + 1);
		}

		void promptReplace(index);
	};

	void promptOne();
}

async function round(options: { gameInfo: GameInfo; leader: number; solo: boolean }, table: Card[] = [], lead?: CardSuit, index = 0): Promise<void> {
	if (options.gameInfo.players[index].out) {
		if (index === 3) {
			return;
		}

		return round(options, table, lead, index + 1);
	}

	const legalPlays: APISelectMenuOption[] = [];
	for (const [id, card] of options.gameInfo.players[index].hand.entries()) {
		if (!lead || lead === realSuit(options.gameInfo.trump!, card)) {
			legalPlays.push({
				label: `${card.rankName} of ${card.suitName}`,
				value: id.toString(),
			});
		}
	}

	if (legalPlays.length === 0) {
		for (const [id, card] of options.gameInfo.players[index].hand.entries()) {
			legalPlays.push({
				label: `${card.rankName} of ${card.suitName}`,
				value: id.toString(),
			});
		}
	}

	const dm = await options.gameInfo.players[index].user.createDM();
	const { embeds, files } = await multicardMessage(options.gameInfo.players[index].hand, responseEmbed(EmbedType.Info, 'Select a card to play'));
	const message = await dm.send(
		messageOptions({
			embeds,
			files,
			components: [
				new ActionRowBuilder<SelectMenuBuilder>({
					components: [
						{
							type: ComponentType.SelectMenu,
							customId: 'play',
							placeholder: 'Select a Card',
							options: legalPlays,
						},
					],
				}),
			],
		}),
	);
	try {
		const component = await message.awaitMessageComponent({
			componentType: ComponentType.SelectMenu,
			time: 300_000,
		});

		await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [], files: [] }));

		const playedCard = options.gameInfo.players[index].hand.splice(Number.parseInt(component.values[0], 10))[0];
		table.push(playedCard);
		lead ??= playedCard.suit;
	} catch {
		await message.edit(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Success!')], components: [], files: [] }));

		const playedCard = options.gameInfo.players[index].hand.splice(Number.parseInt(legalPlays[0].value, 10))[0];
		table.push(playedCard);
		lead ??= playedCard.suit;
	}

	if (index === 3) {
		return determineTrick(options, table, lead);
	}

	return round(options, table, lead, index + 1);
}

async function score(options: { gameInfo: GameInfo; leader: number; solo: boolean }): Promise<void> {
	const winningTeam = options.gameInfo.team1.tricks > options.gameInfo.team2.tricks ? options.gameInfo.team1 : options.gameInfo.team2;
	if (winningTeam !== options.gameInfo.players[options.leader].team) {
		winningTeam.score += 2;
	} else if (winningTeam.tricks === 5) {
		winningTeam.score += options.solo ? 4 : 2;
	} else {
		winningTeam.score++;
	}

	if (winningTeam.score >= 10) {
		return finish(options.gameInfo, winningTeam);
	}

	await options.gameInfo.gameChannel.send(
		responseOptions(EmbedType.Info, 'Standings', {
			fields: [
				{
					name: 'Team 1',
					value: `${options.gameInfo.team1.score} points`,
				},
				{
					name: 'Team 2',
					value: `${options.gameInfo.team2.score} points`,
				},
			],
		}),
	);
	options.gameInfo.players.unshift(options.gameInfo.players.pop()!);
	for (const player of options.gameInfo.players) {
		player.out = false;
	}

	void startRound(options.gameInfo);
}

async function finish(gameInfo: GameInfo, winningTeam: EuchreTeam): Promise<void> {
	await gameInfo.gameChannel.send(
		responseOptions(EmbedType.Info, `${winningTeam.name} Wins!`, {
			fields: [
				{
					name: 'Team 1',
					value: `${gameInfo.team1.score} points`,
				},
				{
					name: 'Team 2',
					value: `${gameInfo.team2.score} points`,
				},
			],
		}),
	);
	setTimeout(() => {
		try {
			void gameInfo.gameChannel.setArchived(true);
		} catch {
			/* Thread deleted */
		}
	}, 10_000);
}

// eslint-disable-next-line complexity
async function determineTrick(options: { gameInfo: GameInfo; leader: number; solo: boolean }, table: Card[], lead: CardSuit): Promise<void> {
	let leadingPlayer: number;
	let leadingScore = 0;
	for (const [id, card] of table.entries()) {
		if (card.suit !== lead && card.suit !== options.gameInfo.trump!) {
			continue;
		}

		let score: number;
		if (card.rank === CardRank.Jack && card.suit === invertSuit(options.gameInfo.trump!)) {
			score = 12;
		} else if (card.suit === options.gameInfo.trump) {
			switch (card.rank) {
				case CardRank.Nine:
					score = 7;
					break;
				case CardRank.Ten:
					score = 8;
					break;
				case CardRank.Queen:
					score = 9;
					break;
				case CardRank.King:
					score = 10;
					break;
				case CardRank.Ace:
					score = 11;
					break;
				case CardRank.Jack:
					score = 13;
					break;
				default:
					throw new Error('Invalid card value');
			}
		} else {
			switch (card.rank) {
				case CardRank.Nine:
					score = 1;
					break;
				case CardRank.Ten:
					score = 2;
					break;
				case CardRank.Jack:
					score = 3;
					break;
				case CardRank.Queen:
					score = 4;
					break;
				case CardRank.King:
					score = 5;
					break;
				case CardRank.Ace:
					score = 6;
					break;
				default:
					throw new Error('Invalid card value');
			}
		}

		if (score > leadingScore) {
			leadingScore = score;
			leadingPlayer = id;
		}
	}

	options.gameInfo.players[leadingPlayer!].team.tricks++;
	await options.gameInfo.gameChannel.send(
		responseOptions(EmbedType.Info, 'Standings', {
			fields: [
				{
					name: 'Team 1:',
					value: `${options.gameInfo.team1.tricks} tricks`,
				},
				{
					name: 'Team 2',
					value: `${options.gameInfo.team2.tricks} tricks`,
				},
			],
		}),
	);
	if (options.gameInfo.team1.tricks + options.gameInfo.team2.tricks === 5) {
		return score(options);
	}

	void round(options);
}

function invertSuit(suit: CardSuit): CardSuit {
	switch (suit) {
		case CardSuit.Spades:
			return CardSuit.Clubs;
		case CardSuit.Clubs:
			return CardSuit.Spades;
		case CardSuit.Hearts:
			return CardSuit.Diamonds;
		case CardSuit.Diamonds:
			return CardSuit.Hearts;
	}
}

function realSuit(trump: CardSuit, card: Card): CardSuit {
	return card.rank === CardRank.Jack && card.suit === invertSuit(trump) ? trump : card.suit;
}
