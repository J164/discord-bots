import { type UserManager } from 'discord.js';
import { type Db } from 'mongodb';
import { EmbedType, messageOptions, responseEmbed, responseOptions } from '../util/builders.js';
import { checkUpdates, fetchCourseData } from '../util/irc.js';

/**
 * Compares current grade data with previously stored data and sends updates to relevant users
 * @param database MongoDB database connection object
 * @param userObjects The UserManager for the PotatoClient
 * @returns A Promise that resolves when all the updates have been sent
 */
export async function gradeReport(database: Db, userObjects: UserManager): Promise<void> {
	const collection = database.collection<IrcUser>('grades');
	const users = await collection.find().toArray();

	await Promise.allSettled(
		users.map(async (user): Promise<void> => {
			if (user.tokenReset) {
				return;
			}

			const userObject = await userObjects.fetch(user.discordId);
			const dm = await userObject.createDM();

			const newGrades = await fetchCourseData(user.token);
			if (!newGrades) {
				await collection.replaceOne({ discordId: user.discordId }, { discordId: user.discordId, grades: user.grades, token: user.token, tokenReset: true });
				await dm.send(responseOptions(EmbedType.Error, 'Token has been reset!'));
				return;
			}

			const diff = checkUpdates(user.grades, newGrades);

			if (!diff.changes) {
				return;
			}

			await collection.replaceOne(
				{ discordId: user.discordId },
				{ discordId: user.discordId, grades: newGrades, token: user.token, tokenReset: user.tokenReset },
			);

			if (diff.termName) {
				await dm.send(responseOptions(EmbedType.Info, `New IRC Term! (${diff.termName.oldName} -> ${diff.termName.newName})`));
				return;
			}

			const embeds = [
				responseEmbed(EmbedType.Info, 'IRC Update!'),
				...diff.newCourses.map((course) => {
					return responseEmbed(EmbedType.Info, `${course.name} was added to IRC`, {
						fields: [
							{
								name: 'Projected Grade:',
								value: course.projectedGrade || 'not yet calculated',
							},
							{
								name: 'Standards:',
								value: course.standards
									.map((standard) => {
										return `${standard.name}: ${standard.proficiencyScore}`;
									})
									.join('\n'),
							},
						],
					});
				}),
				...diff.courses.map((course) => {
					if (course.isFinal) {
						return responseEmbed(
							EmbedType.Info,
							`${course.name} - Grade Finalized (${course.projectedGrade?.oldGrade ?? 'unknown'} -> ${course.projectedGrade?.newGrade ?? 'unknown'})`,
						);
					}

					if (course.projectedGrade) {
						return responseEmbed(EmbedType.Info, `${course.name} - ${course.projectedGrade.oldGrade} -> ${course.projectedGrade.newGrade}`, {
							fields: course.standardScore.map((score) => {
								return { name: `${score.standard}: `, value: `${score.oldScore} -> ${score.newScore}` };
							}),
						});
					}

					return responseEmbed(EmbedType.Info, `New assignments in ${course.name}`, {
						fields: course.newAssignments.map((assignment) => {
							return {
								name: `You got a ${assignment.score} on assignment "${assignment.name}"`,
								value: assignment.comments ? `Teacher Comments: "${assignment.comments}"` : 'No teacher comments on this assignment',
							};
						}),
					});
				}),
			];

			await dm.send(messageOptions({ embeds }));
		}),
	);
}
