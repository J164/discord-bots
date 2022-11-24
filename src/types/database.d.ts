/** Type for Documents in the "Grades" collection */
type IrcUser = {
	discordId: string;
	token: string;
	grades: Grades;
	tokenReset: boolean;
};
