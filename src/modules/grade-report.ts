import type { UserManager } from 'discord.js';
import type { Db } from 'mongodb';
import { EmbedType, responseOptions } from '../util/builders.js';
import { checkUpdates, fetchCourseData } from '../util/irc.js';

/**
 * Compares current grade data with previously stored data and sends updates to relevant users
 * @param database MongoDB database connection object
 * @param userObjects The UserManager for the PotatoClient
 * @returns A Promise that resolves when all the updates have been sent
 */
export async function gradeReport(database: Db, userObjects: UserManager): Promise<void> {
	const collection = database.collection<IrcUser>('grades');
	const users = (await collection.indexes()) as IrcUser[];

	await Promise.allSettled(
		users.map(async (user): Promise<void> => {
			const userObject = await userObjects.fetch(user.discordId);
			const dm = await userObject.createDM();

			const newGrades = await fetchCourseData(user.token);
			if (!newGrades) {
				await dm.send(responseOptions(EmbedType.Error, 'Token has been reset!'));
				return;
			}

			const diff = checkUpdates(user.grades, newGrades);

			if (!diff.changes) {
				return;
			}

			await collection.replaceOne({ discordId: user.discordId }, { discordId: user.discordId, grades: newGrades, token: user.token });

			if (diff.termName) {
				await dm.send(responseOptions(EmbedType.Info, `New IRC Term! (${diff.termName.oldName} -> ${diff.termName.newName})`));
				return;
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

			await dm.send(
				responseOptions(EmbedType.Info, 'IRC Update!', {
					fields: fields.slice(0, 25),
				}),
			);
		}),
	);
}
