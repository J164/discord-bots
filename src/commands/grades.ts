import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommand, GlobalChatCommandInfo } from '../util/interfaces.js';
import { fetchCourseData, Standard } from '../util/irc.js';

function buildScoreMap(standards: Standard[]): string {
  let string = '';
  for (const standard of standards) {
    if (standard.isHomeworkStandard) {
      continue;
    }
    string += `**${standard.proficiencyScore}** - "${standard.name}"\n${standard.proficiency.exceedsCount} - ${standard.proficiency.meetsCount} - ${standard.proficiency.approachingCount} - ${standard.proficiency.developingCount}\n`;
  }
  return string || 'No scores yet!';
}

async function grades(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  if (!info.privateData.ircAuth[info.interaction.user.id]) {
    return { embeds: [buildEmbed('info', { title: 'You are not registered to use this command!' })] };
  }
  return {
    embeds: (await fetchCourseData(info.privateData.ircAuth[info.interaction.user.id])).courses
      .map((course) => {
        return buildEmbed(course.isFinal ? 'success' : 'info', {
          title: course.name,
          fields: [
            {
              name: course.isFinal ? 'Final Grade' : 'Projected Grade',
              value: course.projectedGrade ?? course.weeklyGrowth ?? 'No projected grade yet!',
            },
            {
              name: 'Weekly Growth',
              value: course.weeklyGrowth ?? 'No weekly growth right now!',
            },
            {
              name: 'Score Ratios (exceeds - meets - approaching - developing)',
              value: buildScoreMap(course.standards),
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
