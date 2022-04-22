import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommand, GlobalChatCommandInfo } from '../util/interfaces.js';
import { APIStandard, fetchCourseData } from '../util/irc.js';

function buildScoreMap(standards: APIStandard[]): string {
  let string = '';
  for (const standard of standards) {
    if (standard.isHomeworkStandard) {
      continue;
    }
    string += `**${standard.proficiency.proficiencyScore}** - ${standard.standardName}\n${standard.proficiency.exceedsCount} - ${standard.proficiency.meetsCount} - ${standard.proficiency.approachingCount} - ${standard.proficiency.developingCount}\n`;
  }
  return string;
}

async function grades(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  return {
    embeds: (await fetchCourseData(info.privateData.ircAuth[info.interaction.user.id])).courses
      .map((course) => {
        return buildEmbed(course.assessment.isFinal ? 'success' : 'info', {
          title: course.name,
          fields: [
            {
              name: course.assessment.isFinal ? 'Final Grade' : 'Projected Grade',
              value: course.assessment.projectedGrade || course.assessment.weeklyGrowth,
            },
            {
              name: 'Weekly Growth',
              value: course.assessment.weeklyGrowth,
            },
            {
              name: 'Score Ratios (exceeds - meets - approaching - developing)',
              value: buildScoreMap(course.assessment.standards),
            },
          ],
        });
      })
      .slice(0, 9),
  };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'grades',
    description: 'Fetch your grades from IRC',
  },
  respond: grades,
  type: 'Global',
  ephemeral: true,
};
