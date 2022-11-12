import { ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle, ComponentType } from 'discord.js';
import type { ButtonBuilder } from 'discord.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { responseOptions, responseEmbed, Emojis, EmbedType, messageOptions } from '../../util/builders.js';
import { fetchCourseData } from '../../util/irc.js';

function buildScoreMap(standards: Standard[]): string {
	const string = [];
	for (const standard of standards) {
		if (standard.isHomeworkStandard) {
			continue;
		}

		string.push(
			`**${standard.proficiencyScore}** - "${standard.name}"\n${standard.proficiency.exceedsCount} - ${standard.proficiency.meetsCount} - ${standard.proficiency.approachingCount} - ${standard.proficiency.developingCount}`,
		);
	}

	return string.join('\n') || 'No scores yet!';
}

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

		let dm;
		try {
			dm = await response.interaction.user.createDM();
		} catch {
			await response.interaction.editReply(responseOptions(EmbedType.Error, "Couldn't send a DM! Make sure your privacy settings allow Potato Bot to DM you."));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Check your DMs for further instructions'));

		const question = await dm.send(
			messageOptions({
				embeds: [
					responseEmbed(
						EmbedType.Prompt,
						'Does this look correct? (Some courses may not show up, only select no if nothing shows up and you know you have a projected grade in at least one class)',
					),
					...courseData.courses.map((course) => {
						return responseEmbed(course.isFinal ? EmbedType.Success : EmbedType.Info, course.name, {
							fields: [
								{
									name: course.isFinal ? 'Final Grade' : 'Projected Grade',
									value: course.projectedGrade || course.weeklyGrowth || 'No projected grade yet!',
								},
								{
									name: 'Weekly Growth',
									value: course.weeklyGrowth || 'No weekly growth right now!',
								},
								{
									name: 'Score Ratios (exceeds - meets - approaching - developing)',
									value: buildScoreMap(course.standards),
								},
							],
						});
					}),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>({
						components: [
							{
								type: ComponentType.Button,
								customId: 'yes',
								emoji: Emojis.GreenCheckMark,
								label: 'Yes',
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: 'no',
								emoji: Emojis.RedX,
								label: 'No',
								style: ButtonStyle.Secondary,
							},
						],
					}),
				],
			}),
		);

		let component;
		try {
			component = await question.awaitMessageComponent({
				time: 300_000,
				componentType: ComponentType.Button,
			});
		} catch {
			await question.edit(messageOptions({ embeds: [responseEmbed(EmbedType.Error, 'Request Timed Out!')], components: [] }));
			return;
		}

		if (component.customId !== 'yes') {
			await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Error, 'PLACEHOLDER')], components: [] }));
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
				},
			);
		} else {
			await gradeCollection.insertOne({
				discordId: response.interaction.user.id,
				grades: courseData,
				token,
			});
		}

		await component.update(messageOptions({ embeds: [responseEmbed(EmbedType.Success, 'Setup successful!')], components: [] }));
	},
	ephemeral: true,
	type: 'Global',
};
