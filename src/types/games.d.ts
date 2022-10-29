import type { ThreadChannel, User } from 'discord.js';
import type { Card } from '../util/card-utils.js';
import type { CardSuit } from './card.js';

// Euchre

type GameInfo = {
	readonly team1: EuchreTeam;
	readonly team2: EuchreTeam;
	readonly players: EuchrePlayer[];
	gameChannel: ThreadChannel;
	trump?: CardSuit;
};

type EuchreTeam = {
	tricks: number;
	score: number;
	readonly name: 'Team 1' | 'Team 2';
};

type EuchrePlayer = {
	readonly hand: Card[];
	readonly team: EuchreTeam;
	readonly user: User;
	out: boolean;
};

// Magic Game

type MagicPlayer = {
	readonly name: string;
	life: number;
	poison: number;
	isAlive: boolean;
	readonly commanderDamage: Map<string, number>;
};
