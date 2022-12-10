import { type DMChannel, type User } from 'discord.js';

type UserWithDM = {
	user: User;
	dm: DMChannel;
};
