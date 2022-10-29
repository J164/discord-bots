import type { APIEmbed, ColorResolvable } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

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
export const enum PotatoColors {
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
	const embed = new EmbedBuilder(options);

	switch (type) {
		case EmbedType.Info:
			embed.setColor(color ?? PotatoColors.DefaultBlue).setTitle(`${Emojis.Document}\t${title ?? ''}`);
			break;
		case EmbedType.Error:
			embed.setColor(color ?? PotatoColors.ErrorRed).setTitle(`${Emojis.RedX}\t${title ?? ''}`);
			break;
		case EmbedType.Success:
			embed.setColor(color ?? PotatoColors.SuccessGreen).setTitle(`${Emojis.GreenCheckMark}\t${title ?? ''}`);
			break;
		case EmbedType.Prompt:
			embed.setColor(color ?? PotatoColors.QuestionOrange).setTitle(`${Emojis.QuestionMark}\t${title ?? ''}`);
			break;
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
export function responseOptions(type: EmbedType, title?: string, options?: APIEmbed, color?: ColorResolvable) {
	return { embeds: [responseEmbed(type, title, options, color)] };
}
