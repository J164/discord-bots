import { type AttachmentPayload, type EmbedBuilder } from 'discord.js';
import { type CardCode, type RawCard, CardSuit, CardRank } from '../types/card.js';
import { mergeImages } from './image-utils.js';

/**
 * Represents a playing card
 * @implements {RawCard}
 */
export class Card implements RawCard {
	public constructor(public readonly suit: CardSuit, public readonly rank: CardRank) {}

	public get cardCode(): CardCode {
		return `${this.rank > 10 || this.rank === CardRank.Ace ? this.rankName[0].toUpperCase() : this.rank === 10 ? '0' : this.rank.toString()}${
			this.suitName.toUpperCase()[0]
		}` as CardCode;
	}

	public get suitName(): string {
		switch (this.suit) {
			case CardSuit.Spades: {
				return 'spades';
			}

			case CardSuit.Clubs: {
				return 'clubs';
			}

			case CardSuit.Hearts: {
				return 'hearts';
			}

			case CardSuit.Diamonds: {
				return 'diamonds';
			}
		}
	}

	public get rankName(): string {
		switch (this.rank) {
			case CardRank.Ace: {
				return 'ace';
			}

			case CardRank.Two: {
				return 'two';
			}

			case CardRank.Three: {
				return 'three';
			}

			case CardRank.Four: {
				return 'four';
			}

			case CardRank.Five: {
				return 'five';
			}

			case CardRank.Six: {
				return 'six';
			}

			case CardRank.Seven: {
				return 'seven';
			}

			case CardRank.Eight: {
				return 'eight';
			}

			case CardRank.Nine: {
				return 'nine';
			}

			case CardRank.Ten: {
				return 'ten';
			}

			case CardRank.Jack: {
				return 'jack';
			}

			case CardRank.Queen: {
				return 'queen';
			}

			case CardRank.King: {
				return 'king';
			}
		}
	}

	public get image(): string {
		return `https://deckofcardsapi.com/static/img/${this.cardCode}.png`;
	}
}

/** Represents a deck of playing cards */
export class Deck {
	/**
	 * Generates a random playing card
	 * @param options Which cards can be selected from
	 * @returns A randomly generated card
	 */
	public static randomCard(options: { suits?: CardSuit[]; ranks?: CardRank[] }): Card {
		options.suits ??= [1, 2, 3, 4];
		options.ranks ??= [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

		return new Card(options.suits[Math.floor(Math.random() * 3)], options.ranks[Math.floor(Math.random() * 12)]);
	}

	/**
	 * Generates a number of random playing cards
	 * @param number Number of random cards to generate
	 * @param options Which cards can be selected from
	 * @returns Array of randomly generated cards
	 */
	public static randomCards(number: number, options: { suits?: CardSuit[]; ranks?: CardRank[] }): Card[] {
		const cards = [];
		for (let index = 0; index < number; index++) {
			cards.push(Deck.randomCard(options));
		}

		return cards;
	}

	private readonly _cards: Card[];

	public constructor(options: { suits?: CardSuit[]; ranks?: CardRank[] }) {
		this._cards = [];

		options.suits ??= [1, 2, 3, 4];
		options.ranks ??= [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

		for (const suit of options.suits) {
			for (const rank of options.ranks) {
				this._cards.push(new Card(suit, rank));
			}
		}
	}

	public get size(): number {
		return this._cards.length;
	}

	/**
	 * Randomizes the order of cards in the deck
	 * @returns The Deck instance
	 */
	public shuffle(): this {
		for (let index = this._cards.length - 1; index > 0; index--) {
			const randomIndex = Math.floor(Math.random() * (index + 1));
			[this._cards[index], this._cards[randomIndex]] = [this._cards[randomIndex], this._cards[index]];
		}

		return this;
	}

	/**
	 * Removes a card from the deck and returns it
	 * @returns The drawn card or undefined if the deck is empty
	 */
	public drawCard(): Card | undefined {
		return this._cards.pop();
	}

	/**
	 * Removes a number of cards rom the deck and returns them
	 * @param number Number of cards to draw
	 * @returns An array of the drawn cards or undefined if number is greater than the size of the deck
	 */
	public drawCards(number: number): Card[] | undefined {
		if (number > this._cards.length) {
			return;
		}

		return this._cards.splice(this._cards.length - number);
	}
}

/**
 * Takes a number of card codes and an embed and formats them to be sent as a message
 * @param cards An array of card codes representing the cards to be sent
 * @param embed The embed to be sent with the merged card image
 * @returns A Promise that resolves to the embed and an attachment payload or just the original embed if the image wasn't found
 */
export async function multicardMessage(cards: RawCard[], embed: EmbedBuilder): Promise<{ embeds: EmbedBuilder[]; files: AttachmentPayload[] }> {
	if (cards.length === 1) {
		return {
			embeds: [embed.setImage(cards[0].image)],
			files: [],
		};
	}

	const name = Date.now();

	return {
		embeds: [embed.setImage(`attachment://${name}.png`)],
		files: [
			{
				attachment: await mergeImages(
					cards.map((card) => {
						return card.image;
					}),
					5,
				),
				name: `${name}.png`,
			},
		],
	};
}
