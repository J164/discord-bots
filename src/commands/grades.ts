import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseEmbed, responseOptions } from '../util/builders.js';
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

async function grades(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<InteractionReplyOptions> {
	const courseData = await fetchCourseData(globalInfo.ircToken);
	if (!courseData) {
		return responseOptions('error', { title: 'Token was reset!' });
	}

	if (courseData.courses.length === 0) {
		return responseOptions('info', { title: 'No courses yet!' });
	}

	return {
		embeds: courseData.courses
			.map((course) => {
				return responseEmbed(course.isFinal ? 'success' : 'info', {
					title: course.name,
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
	};
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'grades',
		description: 'Fetch your grades from IRC',
	},
	respond: grades,
	type: 'Global',
	ephemeral: true,
};
