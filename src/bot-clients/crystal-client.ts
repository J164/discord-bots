import { readdir } from 'node:fs/promises';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import type { Logger } from 'pino';
import type { Config, GlobalInfo, GuildInfo } from '../types/bot-types/crystal.js';
import { BotClient } from '../util/bot-client.js';

/** Class representing the client for Crystal Bot */
export class CrystalClient extends BotClient<GlobalInfo, GuildInfo, Config> {
	public constructor(config: Config, status?: string) {
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
		const commands = await readdir('./dist/commands/crystal');
		await Promise.all(
			commands.map((file) => {
				if (!file.endsWith('.js')) {
					return;
				}

				return this.importCommand(`./commands/crystal/${file}`);
			}),
		);
	}

	protected getGlobalInfo(logger: Logger): GlobalInfo {
		return {
			logger,
			ostDirectory: this.config.ostDirectory,
		};
	}

	protected getDefaultGuildInfo(): GuildInfo {
		return {};
	}
}
