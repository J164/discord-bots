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
          name: course.name,
          value: course.projectedGrade,
        };
      }),
      ...diff.courses.map((course) => {
        if (course.isFinal) {
          return {
            name: `${course.name} - Grade Finalized`,
            value: `${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`,
          };
        }
        if (course.projectedGrade) {
          return {
            name: `${course.name} - ${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`,
            value:
              course.standardScore.length > 0
                ? `${course.standardScore[0].standard}: ${course.standardScore[0].oldScore} -> ${course.standardScore[0].newScore}`
                : 'Check IRC for more info',
          };
        }
        if (course.newAssignments.length > 0) {
          return {
            name: `You got a ${course.newAssignments[0].score} on assignment "${course.newAssignments[0].name}" in ${course.name}`,
            value: course.newAssignments.length > 1 ? `and ${course.newAssignments.length - 1} more!` : "That's all for now!",
          };
        }
      }),
    ].filter(Boolean),
  });
}
