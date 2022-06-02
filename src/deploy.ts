import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { readdirSync } from 'node:fs';
import { env } from 'node:process';
import { ChatCommand } from './bot-client.js';

const crystalCommandData = await Promise.all(
  readdirSync('./dist/src/commands/crystal')
    .filter((file) => file.endsWith('.js'))
    .map(async (command) => {
      return ((await import(`./commands/crystal/${command}`)) as { command: ChatCommand<'Global' | 'Guild'> }).command.data;
    }),
);

const swearCommandData = await Promise.all(
  readdirSync('./dist/src/commands/swear')
    .filter((file) => file.endsWith('.js'))
    .map(async (command) => {
      return ((await import(`./commands/swear/${command}`)) as { command: ChatCommand<'Global' | 'Guild'> }).command.data;
    }),
);

const yeetCommandData = await Promise.all(
  readdirSync('./dist/src/commands/yeet')
    .filter((file) => file.endsWith('.js'))
    .map(async (command) => {
      return ((await import(`./commands/yeet/${command}`)) as { command: ChatCommand<'Global' | 'Guild'> }).command.data;
    }),
);

await Promise.all([
  new REST({ version: '10' }).setToken(env.npm_config_crystal_token!).put(Routes.applicationCommands(env.npm_config_crystal_id!), { body: crystalCommandData }),
  new REST({ version: '10' }).setToken(env.npm_config_swear_token!).put(Routes.applicationCommands(env.npm_config_swear_id!), { body: swearCommandData }),
  new REST({ version: '10' }).setToken(env.npm_config_yeet_token!).put(Routes.applicationCommands(env.npm_config_yeet_id!), { body: yeetCommandData }),
]);
