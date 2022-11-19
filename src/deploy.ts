import { readdir } from 'node:fs/promises';
import { env } from 'node:process';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { type BaseGlobalInfo, type BaseGuildInfo, type CommandType, type ChatCommand } from './types/client.js';

async function getCommands(botName: string) {
	const files = await readdir(`./commands/${botName}`);
	return Promise.all(
		files
			.filter((file) => file.endsWith('.js'))
			.map(async (command) => {
				return ((await import(`./commands/${botName}/${command}`)) as { command: ChatCommand<CommandType, BaseGlobalInfo, BaseGuildInfo> }).command.data;
			}),
	);
}

await Promise.all([
	new REST({ version: '10' }).setToken(env.crystal_token ?? '').put(Routes.applicationCommands(env.crystal_id ?? ''), { body: await getCommands('crystal') }),
	new REST({ version: '10' }).setToken(env.potato_token ?? '').put(Routes.applicationCommands(env.potato_id ?? ''), { body: await getCommands('potato') }),
	new REST({ version: '10' }).setToken(env.swear_token ?? '').put(Routes.applicationCommands(env.swear_id ?? ''), { body: await getCommands('swear') }),
	new REST({ version: '10' }).setToken(env.yeet_token ?? '').put(Routes.applicationCommands(env.yeet_id ?? ''), { body: await getCommands('yeet') }),
]);
