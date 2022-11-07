import type { APISelectMenuOption, ButtonInteraction, EmbedBuilder, InteractionUpdateOptions, ThreadChannel } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import type { MagicPlayer } from '../../types/games.js';
import { EmbedType, responseEmbed, responseOptions } from '../../util/builders.js';

export async function playMagic(playerData: MagicPlayer[], gameChannel: ThreadChannel): Promise<void> {
	const message = await gameChannel.send({
		embeds: [printStandings(playerData)],
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						label: 'Damage',
						customId: 'damage',
						style: ButtonStyle.Primary,
					},
					{
						type: ComponentType.Button,
						label: 'Heal',
						customId: 'heal',
						style: ButtonStyle.Secondary,
					},
					{
						type: ComponentType.Button,
						label: 'End',
						customId: 'end',
						style: ButtonStyle.Danger,
					},
				],
			},
		],
	});

	const component = await message.awaitMessageComponent({
		componentType: ComponentType.Button,
		time: 300_000,
	});

	await component.update({ components: [] });

	switch (component.customId) {
		case 'damage':
			await prompt(playerData, gameChannel, component);
			break;
		case 'heal':
			await heal(playerData, gameChannel, component);
			break;
		case 'end':
			await component.update({ embeds: [printStandings(playerData)] });
			try {
				await gameChannel.setArchived(true);
			} catch {
				// Thread deleted
			}

			break;
	}
}

function healPrompt(players: APISelectMenuOption[], playerResponse: boolean, amountResponse: boolean): InteractionUpdateOptions {
	return {
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.SelectMenu,
						customId: 'player_select',
						options: players,
						disabled: playerResponse,
					},
				],
			},
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						label: 'Submit',
						customId: 'amount_submit',
						style: ButtonStyle.Primary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '1 Life',
						customId: 'amount_1',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '2 Life',
						customId: 'amount_2',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '5 Life',
						customId: 'amount_5',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '10 Life',
						customId: 'amount_10',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
				],
			},
		],
	};
}

async function heal(playerData: MagicPlayer[], gameChannel: ThreadChannel, interaction: ButtonInteraction): Promise<void> {
	const players: APISelectMenuOption[] = [];
	for (const [index, player] of playerData.entries()) {
		players.push({ label: player.name, value: index.toString() });
	}

	let playerResponse = false;
	let amountResponse = false;
	const response = await interaction.update(healPrompt(players, playerResponse, amountResponse));
	let responses: [string, number];
	try {
		responses = (await Promise.all([
			(async () => {
				const component = await response.awaitMessageComponent({
					componentType: ComponentType.SelectMenu,
					time: 300_000,
				});
				playerResponse = true;
				await component.update(healPrompt(players, playerResponse, amountResponse));
				return component.values[0];
			})(),
			new Promise((resolve, reject) => {
				let amount = 0;
				const collector = response
					.createMessageComponentCollector({
						componentType: ComponentType.Button,
						time: 300_000,
					})
					.on('collect', async (b) => {
						if (b.customId === 'submit') {
							collector.stop();
							amountResponse = true;
							await b.update(healPrompt(players, playerResponse, amountResponse));
							resolve(amount);
							return;
						}

						switch (b.customId.split('_')[1]) {
							case '1':
								amount++;
								break;
							case '2':
								amount += 2;
								break;
							case '5':
								amount += 5;
								break;
							case '10':
								amount += 10;
								break;
						}

						await b.update({
							embeds: [printStandings(playerData), responseEmbed(EmbedType.Info, `Current Amount: ${amount}`)],
						});
					})
					.once('end', async (b) => {
						const interaction = b.at(0);
						if (!interaction) {
							reject();
							return;
						}

						amountResponse = true;
						await interaction.update(healPrompt(players, playerResponse, amountResponse));
						resolve(Number.parseInt(interaction.customId.split('-')[2], 10));
					});
			}),
		])) as [string, number];
	} catch {
		await playMagic(playerData, gameChannel);
		return;
	}

	playerData[Number.parseInt(responses[0], 10)].life += responses[1];
	await playMagic(playerData, gameChannel);
}

function damagePrompt(players: APISelectMenuOption[], playerResponse: boolean, modifierResponse: boolean, amountResponse: boolean): InteractionUpdateOptions {
	return {
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.SelectMenu,
						customId: 'player_select',
						options: players,
						disabled: playerResponse,
					},
				],
			},
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.SelectMenu,
						customId: 'modifiers',
						maxValues: 2,
						options: [
							{
								label: 'None',
								value: 'none',
								description: 'None of the below options',
							},
							{
								label: 'Poison',
								value: 'poison',
								description: 'Whether the damage will apply poison counters',
							},
							{
								label: 'Commander',
								value: 'commander',
								description: 'Whether the damage will apply commander damage',
							},
						],
						disabled: modifierResponse,
					},
				],
			},
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						label: 'Submit',
						customId: 'amount_submit',
						style: ButtonStyle.Primary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '1 Damage',
						customId: 'amount_1',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '2 Damage',
						customId: 'amount_2',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '5 Damage',
						customId: 'amount_5',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
					{
						type: ComponentType.Button,
						label: '10 Damage',
						customId: 'amount_10',
						style: ButtonStyle.Secondary,
						disabled: amountResponse,
					},
				],
			},
		],
	};
}

async function prompt(playerData: MagicPlayer[], gameChannel: ThreadChannel, interaction: ButtonInteraction): Promise<void> {
	const players: APISelectMenuOption[] = [];
	for (const [index, player] of playerData.entries()) {
		players.push({ label: player.name, value: index.toString() });
	}

	let playerResponse = false;
	let modifierResponse = false;
	let amountResponse = false;
	const response = await interaction.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse));
	let responses: [{ target: string; selector: string }, string[], number];
	try {
		responses = (await Promise.all([
			(async () => {
				const component = await response.awaitMessageComponent({
					filter: (s) => s.customId === 'player_select',
					componentType: ComponentType.SelectMenu,
					time: 300_000,
				});
				playerResponse = true;
				await component.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse));
				return {
					target: component.values[0],
					selector: component.user.id,
				};
			})(),
			(async () => {
				const component = await response.awaitMessageComponent({
					filter: (s) => s.customId === 'modifiers',
					componentType: ComponentType.SelectMenu,
					time: 300_000,
				});
				modifierResponse = true;
				await component.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse));
				return component.values;
			})(),
			new Promise((resolve) => {
				let amount = 0;
				const collector = response
					.createMessageComponentCollector({
						componentType: ComponentType.Button,
						time: 300_000,
					})
					.on('collect', async (b) => {
						if (b.customId === 'amount_submit') {
							collector.stop();
							amountResponse = true;
							await b.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse));
							resolve(amount);
							return;
						}

						switch (b.customId.split('_')[1]) {
							case '1':
								amount++;
								break;
							case '2':
								amount += 2;
								break;
							case '5':
								amount += 5;
								break;
							case '10':
								amount += 10;
								break;
						}

						await b.update({
							embeds: [printStandings(playerData), responseEmbed(EmbedType.Info, `Current Amount: ${amount}`)],
						});
					});
			}),
		])) as [{ target: string; selector: string }, string[], number];
	} catch {
		await playMagic(playerData, gameChannel);
		return;
	}

	const target = playerData[Number.parseInt(responses[0].target, 10)];
	target.life -= responses[2];
	for (const value of responses[1]) {
		if (value === 'poison') {
			target.poison += responses[2];
			continue;
		}

		if (value === 'commander') {
			target.commanderDamage[Number.parseInt(responses[0].target, 10)] += responses[2];
		}
	}

	await checkStatus(playerData, gameChannel, target);
}

async function checkStatus(playerData: MagicPlayer[], gameChannel: ThreadChannel, player: MagicPlayer): Promise<void> {
	if (player.life < 1 || player.poison >= 10) {
		return endGame(playerData, gameChannel, player);
	}

	for (const commander of player.commanderDamage) {
		if (commander >= 21) {
			return endGame(playerData, gameChannel, player);
		}
	}

	await playMagic(playerData, gameChannel);
}

async function endGame(playerData: MagicPlayer[], gameChannel: ThreadChannel, player: MagicPlayer): Promise<void> {
	player.isAlive = false;
	const alivePlayers = playerData.filter((user) => user.isAlive);
	if (alivePlayers.length < 2) {
		const alivePlayer = alivePlayers[0];

		await gameChannel.send(
			responseOptions(EmbedType.Info, `${alivePlayer.name} Wins!`, {
				fields: [
					{
						name: `${alivePlayer.name}:`,
						value: `Life Total: ${alivePlayer.life}\nPoison Counters: ${alivePlayer.poison}`,
					},
				],
			}),
		);
		try {
			await gameChannel.setArchived(true);
		} catch {
			/* Thread deleted */
		}
	}
}

function printStandings(playerData: MagicPlayer[]): EmbedBuilder {
	const embed = responseEmbed(EmbedType.Info, 'Current Standings');
	embed.addFields(
		playerData.map((player) => {
			const value = ['Commander Damage'];
			for (const [index, damage] of player.commanderDamage.entries()) {
				value.push(`${playerData[index].name}: ${damage}`);
			}

			return {
				name: `${player.name}: ${player.isAlive ? `Life Total: ${player.life}\nPoison Counters: ${player.poison}` : 'ELIMINATED'}`,
				value: value.join('\n'),
			};
		}),
	);

	return embed;
}
