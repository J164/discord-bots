import { type APIEmbed, type BaseMessageOptions, type UserManager, type APIActionRowComponent, type APIMessageActionRowComponent } from 'discord.js';
import { type UserWithDm } from '../types/helper.js';

/** Enum representing commonly used emojis */
export const enum Emojis {
	Document = '\uD83D\uDCC4',
	RedX = '\u274C',
	GreenCheckMark = '\u2705',
	QuestionMark = '\u2753',
	DoubleArrowLeft = '\u23EA',
	ArrowLeft = '\u2B05\uFE0F',
	ArrowRight = '\u27A1\uFE0F',
	DoubleArrowRight = '\u23E9',
}

/** Enum representing commonly used colors */
export const enum BotColors {
	DefaultBlue = 0x00_99_ff,
	ErrorRed = 0xff_00_00,
	SuccessGreen = 0x00_ff_00,
	QuestionOrange = 0xff_a5_00,
}

/** Enum representing common embed types */
export const enum EmbedType {
	Info,
	Error,
	Success,
	Prompt,
	None,
}

/**
 * Fetches a user and creates a DM channel with them
 * @param userId The ID of the user
 * @param userManager The UserManager for the Client
 * @returns A Promise that resolves to the User object and DM channel
 */
export async function fetchUser(userId: string, userManager: UserManager): Promise<UserWithDm> {
	const user = await userManager.fetch(userId);
	const dm = await user.createDM();
	return { user, dm };
}

/**
 * Formats an embed based on its type
 * @param type Which type of formatting to use
 * @param title Optional title of the embed
 * @param options The embed to be formated
 * @returns The formated embed
 */
export function responseEmbed(type: EmbedType, title: string, options?: Omit<APIEmbed, 'title'>): APIEmbed {
	options?.fields?.splice(25);

	const embed: APIEmbed = options ?? {};

	switch (type) {
		case EmbedType.Info: {
			embed.color ??= BotColors.DefaultBlue;
			embed.title = `${Emojis.Document}\t${title}`;
			break;
		}

		case EmbedType.Error: {
			embed.color ??= BotColors.ErrorRed;
			embed.title = `${Emojis.RedX}\t${title}`;
			break;
		}

		case EmbedType.Success: {
			embed.color ??= BotColors.SuccessGreen;
			embed.title = `${Emojis.GreenCheckMark}\t${title}`;
			break;
		}

		case EmbedType.Prompt: {
			embed.color ??= BotColors.QuestionOrange;
			embed.title = `${Emojis.QuestionMark}\t${title}`;
			break;
		}

		case EmbedType.None: {
			embed.title = title;
			break;
		}
	}

	return embed;
}

/**
 * Formats an embed based on its type and wraps it as a message
 * @param type Which type of formatting to use
 * @param title Optional title of the embed
 * @param options The embed to be formated
 * @returns The formated embed wrapped as a message
 */
export function responseOptions(type: EmbedType, title: string, options?: APIEmbed): BaseMessageOptions {
	return { embeds: [responseEmbed(type, title, options)] };
}

/**
 * Sanitizes a message to ensure it adheres to the API spec
 * @param options The message to sanitize
 * @returns The sanitized message
 */
export function messageOptions(
	options: BaseMessageOptions & { embeds?: APIEmbed[]; components?: Array<APIActionRowComponent<APIMessageActionRowComponent>> },
): BaseMessageOptions {
	options.embeds?.splice(10);
	options.components?.splice(5);

	return options;
}
