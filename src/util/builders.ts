import {
	type ActionRowBuilder,
	type APIEmbed,
	type BaseMessageOptions,
	type ColorResolvable,
	type MessageActionRowComponentBuilder,
	EmbedBuilder,
} from 'discord.js';

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
 * Formats an embed based on its type
 * @param type Which type of formatting to use
 * @param title Optional title of the embed
 * @param options The embed to be formated
 * @param color Optional color of the embed
 * @returns The formated embed
 */
export function responseEmbed(type: EmbedType, title?: string, options?: Omit<APIEmbed, 'title' | 'color'>, color?: ColorResolvable): EmbedBuilder {
	options?.fields?.splice(25);

	const embed = new EmbedBuilder(options);

	switch (type) {
		case EmbedType.Info: {
			embed.setColor(color ?? BotColors.DefaultBlue).setTitle(`${Emojis.Document}\t${title ?? ''}`);
			break;
		}

		case EmbedType.Error: {
			embed.setColor(color ?? BotColors.ErrorRed).setTitle(`${Emojis.RedX}\t${title ?? ''}`);
			break;
		}

		case EmbedType.Success: {
			embed.setColor(color ?? BotColors.SuccessGreen).setTitle(`${Emojis.GreenCheckMark}\t${title ?? ''}`);
			break;
		}

		case EmbedType.Prompt: {
			embed.setColor(color ?? BotColors.QuestionOrange).setTitle(`${Emojis.QuestionMark}\t${title ?? ''}`);
			break;
		}

		default: {
			if (color) {
				embed.setColor(color);
			}

			embed.setTitle(title ?? '');
		}
	}

	return embed;
}

/**
 * Formats an embed based on its type and wraps it as a message
 * @param type Which type of formatting to use
 * @param title Optional title of the embed
 * @param options The embed to be formated
 * @param color Optional color of the embed
 * @returns The formated embed wrapped as a message
 */
export function responseOptions(type: EmbedType, title?: string, options?: APIEmbed, color?: ColorResolvable): BaseMessageOptions {
	return { embeds: [responseEmbed(type, title, options, color)] };
}

/**
 * Sanitizes a message to ensure it adheres to the API spec
 * @param options The message to sanitize
 * @returns The sanitized message
 */
export function messageOptions(
	options: BaseMessageOptions & { embeds?: EmbedBuilder[]; components?: Array<ActionRowBuilder<MessageActionRowComponentBuilder>> },
): BaseMessageOptions {
	options.embeds?.splice(10);
	options.components?.splice(5);

	return options;
}
