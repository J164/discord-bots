import { readdir } from 'node:fs/promises';
import { env } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { CrystalChatCommand } from './types/bot-types/crystal.js';
import type { PotatoChatCommand } from './types/bot-types/potato.js';
import type { SwearChatCommand } from './types/bot-types/swear.js';
import type { YeetChatCommand } from './types/bot-types/yeet.js';

if (!env.npm_config_argv) {
	throw new Error('Please run this file with yarn using the script in package.json');
}

const npmConfig = JSON.parse(env.npm_config_argv) as { original: string[] };
if (npmConfig.original.length < 10) {
	throw new Error('Missing Credentials');
}

const COMMAND_DIR = `${path.dirname(fileURLToPath(import.meta.url))}/commands`;

const commandData = await Promise.all([
	(async () => {
		const files = await readdir(`${COMMAND_DIR}/crystal`);
		return Promise.all(
			files
				.filter((file) => file.endsWith('.js'))
				.map(async (command) => {
					return ((await import(`./commands/crystal/${command}`)) as { command: CrystalChatCommand<'Global' | 'Guild'> }).command.data;
				}),
		);
	})(),
	(async () => {
		const files = await readdir(`${COMMAND_DIR}/potato`);
		return Promise.all(
			files
				.filter((file) => file.endsWith('.js'))
				.map(async (command) => {
					return ((await import(`./commands/potato/${command}`)) as { command: PotatoChatCommand<'Global' | 'Guild'> }).command.data;
				}),
		);
	})(),
	(async () => {
		const files = await readdir(`${COMMAND_DIR}/swear`);
		return Promise.all(
			files
				.filter((file) => file.endsWith('.js'))
				.map(async (command) => {
					return ((await import(`./commands/swear/${command}`)) as { command: SwearChatCommand<'Global' | 'Guild'> }).command.data;
				}),
		);
	})(),
	(async () => {
		const files = await readdir(`${COMMAND_DIR}/yeet`);
		return Promise.all(
			files
				.filter((file) => file.endsWith('.js'))
				.map(async (command) => {
					return ((await import(`./commands/yeet/${command}`)) as { command: YeetChatCommand<'Global' | 'Guild'> }).command.data;
				}),
		);
	})(),
]);

await Promise.all([
	new REST({ version: '10' }).setToken(npmConfig.original[3]).put(Routes.applicationCommands(npmConfig.original[2]), { body: commandData[0] }),
	new REST({ version: '10' }).setToken(npmConfig.original[5]).put(Routes.applicationCommands(npmConfig.original[4]), { body: commandData[1] }),
	new REST({ version: '10' }).setToken(npmConfig.original[7]).put(Routes.applicationCommands(npmConfig.original[6]), { body: commandData[2] }),
	new REST({ version: '10' }).setToken(npmConfig.original[9]).put(Routes.applicationCommands(npmConfig.original[8]), { body: commandData[3] }),
]);
