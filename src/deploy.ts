import { readdir } from 'node:fs/promises';
import { env } from 'node:process';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { type CommandType, type ChatCommand } from './types/client.js';

async function getCommands(botName: string) {
	const files = await readdir(`./dist/commands/${botName}`);
	return Promise.all(
		files
			.filter((file) => file.endsWith('.js'))
			.map(async (command) => {
				return ((await import(`../dist/commands/${botName}/${command}`)) as { command: ChatCommand<CommandType, unknown, unknown> }).command.data;
			}),
	);
}

await Promise.all([
	new REST({ version: '10' })
		.setToken(env.npm_config_crystal_token ?? '')
		.put(Routes.applicationCommands(env.npm_config_crystal_id ?? ''), { body: await getCommands('crystal') }),
	new REST({ version: '10' })
		.setToken(env.npm_config_potato_token ?? '')
		.put(Routes.applicationCommands(env.npm_config_potato_id ?? ''), { body: await getCommands('potato') }),
	new REST({ version: '10' })
		.setToken(env.npm_config_swear_token ?? '')
		.put(Routes.applicationCommands(env.npm_config_swear_id ?? ''), { body: await getCommands('swear') }),
	new REST({ version: '10' })
		.setToken(env.npm_config_yeet_token ?? '')
		.put(Routes.applicationCommands(env.npm_config_yeet_id ?? ''), { body: await getCommands('yeet') }),
]);
