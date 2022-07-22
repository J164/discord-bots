import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { readdirSync } from 'node:fs';
import { env } from 'node:process';
import { ChatCommand } from './index.js';

const commandData = await Promise.all(
  readdirSync('./dist/src/commands')
    .filter((file) => file.endsWith('.js'))
    .map(async (command) => {
      return ((await import(`./commands/${command}`)) as { command: ChatCommand<'Global' | 'Guild'> }).command.data;
    }),
);

await new REST({ version: '10' })
  .setToken(env.npm_config_application_token!)
  .put(Routes.applicationCommands(env.npm_config_application_id!), { body: commandData });
