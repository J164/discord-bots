/**
 * Authenticates with irc, requests, and formats all relevent data
 * @param token Irc login token
 * @returns A Promise that resolves to the formatted response or undefined if the request failed
 */
export async function fetchCourseData(token: string): Promise<Grades | undefined> {
	const authenticateResponse = await fetch('https://irc.d125.org/users/authenticate', {
		headers: {
			Accept: 'application/json',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			Referer: 'https://irc.d125.org/',
			'Content-Type': 'application/json',
			DNT: '1',
			Cookie: token,
		},
	});

	if (!authenticateResponse.ok) {
		return;
	}

	const authenticate = (await authenticateResponse.json()) as IrcAuthenticate;

	const termResponse = await fetch('https://irc.d125.org/course/terms', {
		headers: {
			Accept: 'application/json',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			Referer: 'https://irc.d125.org/reportcard',
			'Content-Type': 'application/json',
			DNT: '1',
			Cookie: token,
		},
	});

	if (!termResponse.ok) {
		return;
	}

	const terms = (await termResponse.json()) as IrcTerm[];

	const courseIds = new Set<number>();

	const manifestResponse = await fetch(`https://irc.d125.org/course/student?pid=${authenticate.personId}&cid=${terms[0].calendarId}&tid=${terms[0].termId}`, {
		headers: {
			Accept: 'application/json',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			Referer: 'https://irc.d125.org/reportcard',
			'Content-Type': 'application/json',
			DNT: '1',
			Cookie: token,
		},
	});

	if (!manifestResponse.ok) {
		return;
	}

	const manifest = ((await manifestResponse.json()) as IrcManifestEntry[]).filter((course) => {
		if (courseIds.has(course.sectionId)) {
			return false;
		}

		courseIds.add(course.sectionId);
		return true;
	});

	const courses: Course[] = [];
	const getCourses = async (course: IrcManifestEntry) => {
		const response = await fetch(
			`https://irc.d125.org/student/gradebookbystudent?sid=${course.sectionId}&pid=${authenticate.personId}&isEBR=${course.ebrFlag ? 'true' : 'false'}`,
			{
				headers: {
					Accept: 'application/json',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate, br',
					Referer: 'https://irc.d125.org/reportcard',
					'Content-Type': 'application/json',
					DNT: '1',
					Cookie: token,
				},
			},
		);

		if (!response.ok) {
			return;
		}

		const courseData = (await response.json()) as IrcCourse;

		if (courseData.assessment.weeklyGrowth === null) {
			return;
		}

		courses.push({
			name: course.courseName,
			projectedGrade: courseData.assessment.projectedGrade,
			weeklyGrowth: courseData.assessment.weeklyGrowth,
			standards: courseData.assessment.standards.map((standard) => {
				return {
					name: standard.standardName,
					proficiencyScore: standard.proficiency.proficiencyScore,
					proficiency: {
						exceedsCount: standard.proficiency.exceedsCount,
						meetsCount: standard.proficiency.meetsCount,
						approachingCount: standard.proficiency.approachingCount,
						developingCount: standard.proficiency.developingCount,
					},
					isHomeworkStandard: standard.isHomeworkStandard,
					assignments: standard.assignments.map((assignment) => {
						return {
							name: assignment.activityName,
							score: assignment.score,
							assigned: !assignment.isNotAssigned,
							active: assignment.standardEventActive === 1,
							isHomework: assignment.isHomework,
							isMissing: assignment.isMissing,
							comments: assignment.comments,
						};
					}),
				};
			}),
			isFinal: courseData.assessment.isFinal,
		});
	};

	await Promise.all(
		manifest.map(async (course) => {
			return getCourses(course);
		}),
	);

	return {
		studentId: authenticate.personId.toString(),
		termName: terms[0].termName,
		courses,
	};
}

/**
 * Compares two sets of grades to check for updates
 * @param oldGrades The original set of grades to compare to
 * @param newGrades The new set of grades to compare with
 * @returns An object representing the difference between the two sets of grades
 */
export function checkUpdates(oldGrades: Grades, newGrades: Grades): GradesDiff {
	const differences: GradesDiff = { courses: [], newCourses: [], changes: false };
	if (oldGrades.termName !== newGrades.termName) {
		differences.changes = true;
		differences.termName = { newName: newGrades.termName, oldName: oldGrades.termName };
		return differences;
	}

	for (const newCourse of newGrades.courses) {
		const oldCourse = oldGrades.courses.find((value) => {
			return value.name === newCourse.name;
		});
		if (!oldCourse) {
			differences.newCourses.push(newCourse);
			continue;
		}

		const courseDiff: CourseDiff = { newAssignments: [], standardScore: [], name: newCourse.name, isFinal: false };
		if (oldCourse.isFinal !== newCourse.isFinal) {
			courseDiff.isFinal = true;
			courseDiff.projectedGrade = { newGrade: newCourse.weeklyGrowth, oldGrade: oldCourse.projectedGrade };
			continue;
		}

		if (oldCourse.projectedGrade !== newCourse.projectedGrade) {
			courseDiff.projectedGrade = { oldGrade: oldCourse.projectedGrade, newGrade: newCourse.projectedGrade };
		}

		for (const newStandard of newCourse.standards) {
			const oldStandard = oldCourse.standards.find((value) => {
				return value.name === newStandard.name;
			});
			if (!oldStandard) {
				continue;
			}

			if (oldStandard.proficiencyScore !== newStandard.proficiencyScore) {
				courseDiff.standardScore.push({
					standard: newStandard.name,
					oldScore: oldStandard.proficiencyScore,
					newScore: newStandard.proficiencyScore,
				});
			}

			for (const newAssignment of newStandard.assignments) {
				if (
					newAssignment.score &&
					!oldStandard.assignments.find((value) => {
						return value.name === newAssignment.name;
					})?.score
				) {
					courseDiff.newAssignments.push(newAssignment);
				}
			}
		}

		if (courseDiff.isFinal || courseDiff.newAssignments.length > 0 || (courseDiff.projectedGrade ?? courseDiff.standardScore.length > 0)) {
			differences.courses.push(courseDiff);
		}
	}

	if (differences.courses.length > 0 || differences.newCourses.length > 0) {
		differences.changes = true;
	}

	return differences;
}
