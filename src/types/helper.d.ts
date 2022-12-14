import { type DMChannel, type User } from 'discord.js';

type UserWithDm = {
	user: User;
	dm: DMChannel;
};
