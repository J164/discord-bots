import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import type { Logger } from 'pino';
import type { Config, GlobalInfo, GuildInfo } from '../types/bot-types/swear.js';
import { BotClient } from '../util/bot-client.js';

const COMMAND_DIR = `${path.dirname(fileURLToPath(import.meta.url))}/../commands/swear`;

/** Class representing the client for Swear Bot */
export class SwearClient extends BotClient<GlobalInfo, GuildInfo, Config> {
	public constructor(config: Config, status: string) {
		super(
			{
				intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
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

				return this.importCommand(`../commands/swear/${file}`);
			}),
		);
	}

	protected getGlobalInfo(logger: Logger): GlobalInfo {
		return {
			logger,
			admin: this.config.admin,
			swear: this.config.swear,
		};
	}

	protected getDefaultGuildInfo(): GuildInfo {
		return {};
	}
}
