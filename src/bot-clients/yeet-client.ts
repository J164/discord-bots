import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import type { Logger } from 'pino';
import type { Config, GlobalInfo, GuildInfo } from '../types/bot-types/yeet.js';
import { BotClient } from '../util/bot-client.js';

const COMMAND_DIR = `${path.dirname(fileURLToPath(import.meta.url))}/../commands/yeet`;

/** Class representing the client for Yeet Bot */
export class YeetClient extends BotClient<GlobalInfo, GuildInfo, Config> {
	public constructor(config: Config, status: string) {
		super(
			{
				intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
				partials: [Partials.Channel],
				presence: {
					activities: [{ name: status, type: ActivityType.Playing }],
				},
			},
			config,
		);
		this.subscribeReadyListener();
	}

	protected async startupTasks(): Promise<void> {
		const commands = await readdir(COMMAND_DIR);
		await Promise.all(
			commands.map((file) => {
				if (!file.endsWith('.js')) {
					return;
				}

				return this.importCommand(`../commands/yeet/${file}`);
			}),
		);
	}

	protected getGlobalInfo(logger: Logger): GlobalInfo {
		return {
			logger,
			tenorKey: this.config.tenorKey,
		};
	}

	protected getDefaultGuildInfo(): GuildInfo {
		return {};
	}
}
