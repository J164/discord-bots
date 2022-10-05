type CardCode = `${'2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | 'J' | 'Q' | 'K' | 'A'}${'S' | 'C' | 'H' | 'D'}`;

/** An object representing a card with only an image */
type RawCard = {
	image: string;
};

/** Enum representing possible playing card suits */
export const enum CardSuit {
	Spades = 1,
	Clubs = 2,
	Hearts = 3,
	Diamonds = 4,
}

/** Enum representing possible playing card ranks */
export const enum CardRank {
	Ace = 1,
	Two = 2,
	Three = 3,
	Four = 4,
	Five = 5,
	Six = 6,
	Seven = 7,
	Eight = 8,
	Nine = 9,
	Ten = 10,
	Jack = 11,
	Queen = 12,
	King = 13,
}
