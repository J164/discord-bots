import { APIEmbed } from 'discord.js';
import { Db } from 'mongodb';
import cron from 'node-cron';
import { responseEmbed } from '../util/builders.js';
import { checkUpdates, fetchCourseData, Grades } from '../util/irc.js';

/**
 * Compares current grade data with previously stored data and creates an embed reporting any changes
 * @param token IRC authentication token
 * @param database MongoDB database connection object
 * @param task cron task scheduling the grade report task
 * @returns the embed reporting any changes or null if there are no changes
 */
export async function gradeReport(token: string, database: Db, task: cron.ScheduledTask): Promise<APIEmbed | null> {
  const newGrades = await fetchCourseData(token);
  if (!newGrades) {
    task.stop();
    return responseEmbed('error', { title: 'Token has been reset!' });
  }
  const oldGrades = (await database.collection('grades').findOne({ studentId: newGrades.studentId })) as unknown as Grades;
  if (!oldGrades) {
    void database.collection('grades').insertOne(newGrades);
    return null;
  }

  const diff = checkUpdates(oldGrades, newGrades);

  if (!diff.changes) {
    return null;
  }

  await database.collection('grades').deleteMany({ studentId: newGrades.studentId });
  void database.collection('grades').insertOne(newGrades);

  if (diff.termName) {
    return responseEmbed('info', {
      title: `New IRC Term! (${diff.termName.oldName} -> ${diff.termName.newName})`,
    });
  }

  const fields = diff.newCourses.map((course) => {
    return {
      name: `${course.name} was added to IRC`,
      value: `Your current grade in this class is ${course.projectedGrade || 'not yet calculated'}`,
    };
  });

  for (const course of diff.courses) {
    if (course.isFinal) {
      fields.push({
        name: `${course.name} - Grade Finalized!`,
        value: `${course.projectedGrade!.oldGrade} -> ${course.projectedGrade!.newGrade}`,
      });
    } else if (course.projectedGrade) {
      fields.push({
        name: `${course.name} - ${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`,
        value:
          course.standardScore.length > 0
            ? `${course.standardScore[0].standard}: ${course.standardScore[0].oldScore} -> ${course.standardScore[0].newScore}`
            : 'Check IRC for more info about this change',
      });
    } else if (course.newAssignments.length > 0) {
      fields.push({
        name: `You got a ${course.newAssignments[0].score} on assignment "${course.newAssignments[0].name}" in ${course.name}`,
        value:
          course.newAssignments.length > 1
            ? `There were also ${course.newAssignments.length - 1} more assignments added to this class! (Check IRC for details)`
            : "That's all for now in this class!",
      });
    }
  }

  return responseEmbed('info', {
    title: 'IRC Update!',
    fields: fields.slice(0, 25),
  });
}
