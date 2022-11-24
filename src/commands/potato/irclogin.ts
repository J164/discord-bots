import { ApplicationCommandOptionType } from 'discord.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { responseOptions, responseEmbed, EmbedType, messageOptions } from '../../util/builders.js';
import { fetchCourseData } from '../../util/irc.js';

export const command: PotatoChatCommand<'Global'> = {
	data: {
		name: 'irclogin',
		description: 'Log in to IRC to recieve grade updates',
		options: [
			{
				name: 'session_token',
				description: 'Use /irchelp to see how to aquire this',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	async respond(response, globalInfo) {
		const token = `IRC2.Auth=${response.interaction.options.getString('session_token', true)}`;

		const courseData = await fetchCourseData(token);
		if (!courseData) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Those credentials seem to be invalid. Use /irchelp to see how to aquire them.'));
			return;
		}

		const gradeCollection = globalInfo.database.collection<IrcUser>('grades');
		const user = await gradeCollection.findOne({ discordId: response.interaction.user.id });

		if (user) {
			await gradeCollection.replaceOne(
				{
					discordId: response.interaction.user.id,
				},
				{
					discordId: response.interaction.user.id,
					grades: courseData,
					token,
					tokenReset: false,
				},
			);
		} else {
			await gradeCollection.insertOne({
				discordId: response.interaction.user.id,
				grades: courseData,
				token,
				tokenReset: false,
			});
		}

		await response.interaction.editReply(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Setup successful!')] }));
	},
	ephemeral: true,
	type: 'Global',
};
