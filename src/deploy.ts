import { readdir } from 'node:fs/promises';
import { env } from 'node:process';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { ChatCommand } from './types/commands.js';

if (!env.npm_config_argv) {
	throw new Error('Please run this file with yarn using the script in package.json');
}

const npmConfig = JSON.parse(env.npm_config_argv) as { original: string[] };
if (npmConfig.original.length < 4) {
	throw new Error('Missing Credentials');
}

const commandFiles = await readdir('./dist/commands');
const commandData = await Promise.all(
	commandFiles
		.filter((file) => file.endsWith('.js'))
		.map(async (command) => {
			return ((await import(`./commands/${command}`)) as { command: ChatCommand<'Global' | 'Guild'> }).command.data;
		}),
);

await new REST({ version: '10' }).setToken(npmConfig.original[3]).put(Routes.applicationCommands(npmConfig.original[2]), { body: commandData });
