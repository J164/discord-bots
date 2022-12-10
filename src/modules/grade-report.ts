import { type MessageCreateOptions, type TextChannel, type UserManager } from 'discord.js';
import { type Db } from 'mongodb';
import { EmbedType, fetchUser, messageOptions, responseEmbed, responseOptions } from '../util/helpers.js';
import { checkUpdates, fetchCourseData } from '../util/irc.js';

/**
 * Generates an update message from a GradesDiff
 * @param diff The grades diff for the update
 * @param username The user's username
 * @returns The update message
 */
function createUpdate(diff: GradesDiff, username: string): MessageCreateOptions {
	if (diff.termName) {
		return responseOptions(EmbedType.Info, `New IRC Term! (${diff.termName.oldName} -> ${diff.termName.newName})`);
	}

	const embeds = [
		responseEmbed(EmbedType.Info, `IRC Update! (${username})`),
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

	return messageOptions({ embeds });
}

/**
 * Compares current grade data with previously stored data and sends updates to relevant users
 * @param database MongoDB database connection object
 * @param userManager The UserManager for the Client
 * @returns A Promise that resolves when all the updates have been sent
 */
export async function gradeReport(database: Db, userManager: UserManager, debugChannel: TextChannel): Promise<void> {
	const collection = database.collection<IrcUser>('grades');
	const users = await collection.find().toArray();

	await Promise.allSettled(
		users.map(async (user): Promise<void> => {
			if (user.tokenReset) {
				return;
			}

			const [{ dm }, newGrades] = await Promise.all([fetchUser(user.discordId, userManager), fetchCourseData(user.token)]);

			if (!newGrades) {
				await Promise.all([
					collection.replaceOne(
						{ discordId: user.discordId },
						{ discordId: user.discordId, username: user.username, grades: user.grades, token: user.token, tokenReset: true },
					),
					debugChannel.send(responseOptions(EmbedType.Error, `Token has been reset for ${user.username}!`)),
				]);
				return;
			}

			const diff = checkUpdates(user.grades, newGrades);

			if (!diff.changes) {
				return;
			}

			const updateMessage = createUpdate(diff, user.username);

			await Promise.all([
				collection.replaceOne(
					{ discordId: user.discordId },
					{ discordId: user.discordId, username: user.username, grades: newGrades, token: user.token, tokenReset: user.tokenReset },
				),
				dm.send(updateMessage),
				debugChannel.send(updateMessage),
			]);
		}),
	);
}
