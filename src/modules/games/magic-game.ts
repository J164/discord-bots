import type { APIEmbed, APISelectMenuOption, ButtonInteraction, InteractionUpdateOptions, ThreadChannel, User } from 'discord.js';
import { ButtonStyle, Collection, ComponentType } from 'discord.js';
import type { MagicPlayer } from '../../types/games.js';
import { responseEmbed, responseOptions } from '../../util/builders.js';

export function playMagic(playerList: User[], life: number, gameChannel: ThreadChannel): void {
	const playerData = new Collection<string, MagicPlayer>();
	for (const player of playerList) {
		playerData.set(player.id, {
			name: player.username,
			life,
			poison: 0,
			isAlive: true,
			commanderDamage: new Map<string, number>(),
		});
	}

	void listen(playerData, gameChannel);
}

async function listen(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel): Promise<void> {
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

	let component;
	try {
		component = await message.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: 300_000,
		});
	} catch {
		await message.edit({ components: [] }).catch();
		void gameChannel.setArchived(true).catch();
		return;
	}

	await component.update({ components: [] });

	switch (component.customId) {
		case 'damage':
			await prompt(playerData, gameChannel, component);
			return;
		case 'heal':
			await heal(playerData, gameChannel, component);
			return;
		case 'end':
			await component.update({ embeds: [printStandings(playerData)] });
			void gameChannel.setArchived(true).catch();
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

async function heal(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, interaction: ButtonInteraction): Promise<void> {
	const players: APISelectMenuOption[] = [];
	for (const [id, player] of playerData) {
		players.push({ label: player.name, value: id });
	}

	let playerResponse = false;
	let amountResponse = false;
	const response = await interaction.update(healPrompt(players, playerResponse, amountResponse));
	let responses: [string, number];
	try {
		responses = (await Promise.all([
			new Promise((resolve, reject) => {
				response
					.awaitMessageComponent({
						componentType: ComponentType.SelectMenu,
						time: 300_000,
					})
					.then(
						(component) => {
							playerResponse = true;
							void component.update(healPrompt(players, playerResponse, amountResponse)).then(() => {
								resolve(component.values[0]);
							});
						},
						() => {
							reject();
						},
					);
			}),
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
							embeds: [printStandings(playerData), responseEmbed('info', { title: `Current Amount: ${amount}` })],
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
		void listen(playerData, gameChannel);
		return;
	}

	playerData.get(responses[0])!.life += responses[1];
	void listen(playerData, gameChannel);
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

async function prompt(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, interaction: ButtonInteraction): Promise<void> {
	const players: APISelectMenuOption[] = [];
	for (const [id, player] of playerData) {
		players.push({ label: player.name, value: id });
	}

	let playerResponse = false;
	let modifierResponse = false;
	let amountResponse = false;
	const response = await interaction.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse));
	let responses: [string[], string[], number];
	try {
		responses = (await Promise.all([
			new Promise((resolve, reject) => {
				response
					.awaitMessageComponent({
						filter: (s) => s.customId === 'player_select',
						componentType: ComponentType.SelectMenu,
						time: 300_000,
					})
					.then(
						(component) => {
							playerResponse = true;
							void component.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse)).then(() => {
								resolve([component.values[0], component.user.id]);
							});
						},
						() => {
							reject();
						},
					);
			}),
			new Promise((resolve, reject) => {
				response
					.awaitMessageComponent({
						filter: (s) => s.customId === 'modifiers',
						componentType: ComponentType.SelectMenu,
						time: 300_000,
					})
					.then(
						(component) => {
							modifierResponse = true;
							void component.update(damagePrompt(players, playerResponse, modifierResponse, amountResponse)).then(() => {
								resolve(component.values);
							});
						},
						() => {
							reject();
						},
					);
			}),
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
							embeds: [printStandings(playerData), responseEmbed('info', { title: `Current Amount: ${amount}` })],
						});
					});
			}),
		])) as [string[], string[], number];
	} catch {
		void listen(playerData, gameChannel);
		return;
	}

	const target = playerData.get(responses[0][0])!;
	target.life -= responses[2];
	for (const value of responses[1]) {
		if (value === 'poison') {
			target.poison += responses[2];
			continue;
		}

		if (value === 'commander') {
			target.commanderDamage.set(responses[0][1], (target.commanderDamage.get(responses[0][1]) ?? 0) + responses[2]);
		}
	}

	void checkStatus(playerData, gameChannel, responses[0][0]);
}

async function checkStatus(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, player: string): Promise<void> {
	if (playerData.get(player)!.life < 1 || playerData.get(player)!.poison >= 10) {
		return endGame(playerData, gameChannel, player);
	}

	for (const [, commander] of playerData.get(player)!.commanderDamage) {
		if (commander >= 21) {
			return endGame(playerData, gameChannel, player);
		}
	}

	void listen(playerData, gameChannel);
}

async function endGame(playerData: Collection<string, MagicPlayer>, gameChannel: ThreadChannel, player: string): Promise<void> {
	playerData.get(player)!.isAlive = false;
	if (playerData.filter((user) => user.isAlive).size < 2) {
		await gameChannel.send(
			responseOptions('info', {
				title: `${playerData.filter((player) => player.isAlive)!.first()!.name} Wins!`,
				fields: [
					{
						name: `${playerData.filter((player) => player.isAlive)!.first()!.name}:`,
						value: `Life Total: ${playerData.filter((player) => player.isAlive)!.first()!.life}\nPoison Counters: ${
							playerData.filter((player) => player.isAlive)!.first()!.poison
						}`,
					},
				],
			}),
		);
		try {
			void gameChannel.setArchived(true);
		} catch {
			/* Thread deleted */
		}
	}
}

function printStandings(playerData: Collection<string, MagicPlayer>): APIEmbed {
	const embed = responseEmbed('info', {
		title: 'Current Standings',
		fields: [],
	});
	for (const [, player] of playerData) {
		const value = ['Commander Damage'];
		for (const [id, damage] of player.commanderDamage) {
			value.push(`${playerData.get(id)!.name}: ${damage}`);
		}

		embed.fields?.push({
			name: `${player.name}: ${player.isAlive ? `Life Total: ${player.life}\nPoison Counters: ${player.poison}` : 'ELIMINATED'}`,
			value: value.join('\n'),
		});
	}

	return embed;
}
