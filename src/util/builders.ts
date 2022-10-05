import type { APIEmbed } from 'discord.js';

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

/**
 * Formats an embed based on its type
 * @param type Which type of formatting to use
 * @param options The embed to be formated
 * @returns The formated embed
 */
export function responseEmbed(type: 'info' | 'error' | 'success' | 'prompt', options: APIEmbed): APIEmbed {
	switch (type) {
		case 'info':
			options.color ??= PotatoColors.DefaultBlue;
			options.title = `${Emojis.Document}\t${options.title ?? ''}`;
			break;
		case 'error':
			options.color ??= PotatoColors.ErrorRed;
			options.title = `${Emojis.RedX}\t${options.title ?? ''}`;
			break;
		case 'success':
			options.color ??= PotatoColors.SuccessGreen;
			options.title = `${Emojis.GreenCheckMark}\t${options.title ?? ''}`;
			break;
		case 'prompt':
			options.color ??= PotatoColors.QuestionOrange;
			options.title = `${Emojis.QuestionMark}\t${options.title ?? ''}`;
			break;
	}

	return options;
}

/**
 * Formats an embed based on its type and wraps it as a message
 * @param type Which type of formatting to use
 * @param options The embed to be formated
 * @returns The formated embed wrapped as a message
 */
export function responseOptions(type: 'info' | 'error' | 'success' | 'prompt', options: APIEmbed) {
	return { embeds: [responseEmbed(type, options)] };
}
