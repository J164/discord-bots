import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseEmbed, responseOptions } from '../util/builders.js';
import { fetchCourseData } from '../util/irc.js';

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

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'grades',
		description: 'Fetch your grades from IRC',
	},
	async respond(response, globalInfo) {
		const courseData = await fetchCourseData(globalInfo.ircToken);
		if (!courseData) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Token was reset!'));
			return;
		}

		if (courseData.courses.length === 0) {
			await response.interaction.editReply(responseOptions(EmbedType.Info, 'No courses yet!'));
			return;
		}

		await response.interaction.editReply({
			embeds: courseData.courses
				.map((course) => {
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
				})
				.slice(0, 10),
		});
	},
	type: 'Global',
	ephemeral: true,
};
