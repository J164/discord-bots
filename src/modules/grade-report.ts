import type { EmbedBuilder } from 'discord.js';
import type { Db } from 'mongodb';
import type cron from 'node-cron';
import { EmbedType, responseEmbed } from '../util/builders.js';
import { checkUpdates, fetchCourseData } from '../util/irc.js';

/**
 * Compares current grade data with previously stored data and creates an embed reporting any changes
 * @param database MongoDB database connection object
 * @param ircToken The session token used to log into IRC
 * @param task Cron task scheduling the grade report task
 * @returns A Promise that resolves to the embed reporting any changes or undefined if there are no changes
 */
export async function gradeReport(database: Db, ircToken: string, task: cron.ScheduledTask): Promise<EmbedBuilder | undefined> {
	const newGrades = await fetchCourseData(ircToken);
	if (!newGrades) {
		task.stop();
		return responseEmbed(EmbedType.Error, 'Token has been reset!');
	}

	const oldGrades = (await database.collection('grades').findOne({ studentId: newGrades.studentId })) as unknown as Grades;
	if (!oldGrades) {
		await database.collection('grades').insertOne(newGrades);
		return;
	}

	const diff = checkUpdates(oldGrades, newGrades);

	if (!diff.changes) {
		return;
	}

	await database.collection('grades').deleteMany({ studentId: newGrades.studentId });
	await database.collection('grades').insertOne(newGrades);

	if (diff.termName) {
		return responseEmbed(EmbedType.Info, `New IRC Term! (${diff.termName.oldName} -> ${diff.termName.newName})`);
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
				value: `${course.projectedGrade?.oldGrade ?? 'unknown'} -> ${course.projectedGrade?.newGrade ?? 'unknown'}`,
			});
			continue;
		}

		if (course.projectedGrade) {
			fields.push({
				name: `${course.name} - ${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`,
				value:
					course.standardScore.length > 0
						? `${course.standardScore[0].standard}: ${course.standardScore[0].oldScore} -> ${course.standardScore[0].newScore}`
						: 'Check IRC for more info about this change',
			});
			continue;
		}

		if (course.newAssignments.length > 0) {
			fields.push({
				name: `You got a ${course.newAssignments[0].score} on assignment "${course.newAssignments[0].name}" in ${course.name}`,
				value:
					course.newAssignments.length > 1
						? `There were also ${course.newAssignments.length - 1} more assignments added to this class! (Check IRC for details)`
						: "That's all for now in this class!",
			});
		}
	}

	return responseEmbed(EmbedType.Info, 'IRC Update!', {
		fields: fields.slice(0, 25),
	});
}
