import { MessageEmbedOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { DatabaseManager } from '../util/database-manager.js';
import { fetchCourseData, Grades, checkUpdates } from '../util/irc.js';

export async function gradeReport(
  ircAuth: { id: string; cid: string; token: string; tid: string },
  databaseManager: DatabaseManager,
): Promise<MessageEmbedOptions> {
  const newGrades = await fetchCourseData(ircAuth);
  const oldGrades = (await databaseManager.findOne('grades', { studentId: ircAuth.id })) as unknown as Grades;
  if (!oldGrades) {
    void databaseManager.insertOne('grades', newGrades);
    return;
  }

  const diff = checkUpdates(oldGrades, newGrades);

  if (!diff.changes) {
    return;
  }

  await databaseManager.deleteMany('grades', { studentId: ircAuth.id });
  void databaseManager.insertOne('grades', newGrades);

  return buildEmbed('info', {
    title: 'IRC Update!',
    fields: [
      ...diff.newCourses.map((course) => {
        return {
          name: `${course.name} was added to IRC`,
          value: `Your current grade in this class is ${course.projectedGrade ?? 'not yet calculated'}`,
        };
      }),
      ...diff.courses.map((course) => {
        if (course.isFinal) {
          return {
            name: `${course.name} - Grade Finalized!`,
            value: `${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`,
          };
        }
        if (course.projectedGrade) {
          return {
            name: `${course.name} - ${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`,
            value:
              course.standardScore.length > 0
                ? `${course.standardScore[0].standard}: ${course.standardScore[0].oldScore} -> ${course.standardScore[0].newScore}`
                : 'Check IRC for more info about this change',
          };
        }
        if (course.newAssignments.length > 0) {
          return {
            name: `You got a ${course.newAssignments[0].score} on assignment "${course.newAssignments[0].name}" in ${course.name}`,
            value:
              course.newAssignments.length > 1
                ? `There were also ${course.newAssignments.length - 1} more assignments added to this class! (Check IRC for details)`
                : "That's all for now in this class!",
          };
        }
      }),
    ].filter(Boolean),
  });
}
