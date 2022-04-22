import { readdirSync } from 'node:fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { env } from 'node:process';

const commandData = await Promise.all(
  readdirSync('./dist/commands')
    .filter((file) => file.endsWith('.js'))
    .map(async (command) => {
      return (await import(`./dist/commands/${command}`)).command.data;
    }),
);

await new REST({ version: '10' })
  .setToken(env.npm_config_application_token)
  .put(Routes.applicationCommands(env.npm_config_application_id), { body: commandData });
