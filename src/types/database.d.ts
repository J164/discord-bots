/** Type for Documents in the "grades" collection */
type IrcUser = {
	readonly discordId: string;
	readonly username: string;
	readonly token: string;
	readonly grades: Grades;
	readonly tokenReset: boolean;
};

/** Type for Documents in the "birthdays" collection */
type Birthday = {
	readonly id: string;
	readonly month: number;
	readonly day: number;
};
