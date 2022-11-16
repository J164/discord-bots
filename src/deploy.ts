import { readdir } from 'node:fs/promises';
import { env } from 'node:process';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { type BaseGlobalInfo, type BaseGuildInfo, type CommandType, type ChatCommand } from './types/client.js';

async function importCommands(botName: string) {
	const files = await readdir(`./commands/${botName}`);
	return Promise.all(
		files
			.filter((file) => file.endsWith('.js'))
			.map(async (command) => {
				return ((await import(`./commands/${botName}/${command}`)) as { command: ChatCommand<CommandType, BaseGlobalInfo, BaseGuildInfo> }).command.data;
			}),
	);
}

const commandData = await Promise.all([importCommands('crystal'), importCommands('potato'), importCommands('swear'), importCommands('yeet')]);

await Promise.all([
	new REST({ version: '10' }).setToken(env.crystal_token ?? '').put(Routes.applicationCommands(env.crystal_id ?? ''), { body: commandData[0] }),
	new REST({ version: '10' }).setToken(env.potato_token ?? '').put(Routes.applicationCommands(env.potato_id ?? ''), { body: commandData[1] }),
	new REST({ version: '10' }).setToken(env.swear_token ?? '').put(Routes.applicationCommands(env.swear_id ?? ''), { body: commandData[2] }),
	new REST({ version: '10' }).setToken(env.yeet_token ?? '').put(Routes.applicationCommands(env.yeet_id ?? ''), { body: commandData[3] }),
]);
