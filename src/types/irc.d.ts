// Raw IRC Data

/** Response from IRC provided after successful authentication */
type IrcAuthenticate = {
	personId: number;
};

/** IRC API data representing a term */
type IrcTerm = {
	calendarId: number;
	termId: number;
	termName: string;
};

/** IRC API data providing an overview of a course */
type IrcManifestEntry = {
	courseId: number;
	courseName: string;
	courseNumber: string;
	ebrFlag: boolean;
	sectionId: number; // Used to make requests and identify courses
	periodId: number;
	teacherDisplay: string;
	teacherPersonID: number;
	periodName: `${'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'}${'A' | 'B'}` | 'ACT';
	periodStart: string; // Timestamp in format YYYY-MM-DDTHH:MM:SS (date is always 1900-01-01)
	teacherName: string;
	teacherEmail: string;
	teacherPhone: string;
	isDropped: 0 | 1;
};

/** IRC API data representing a course's grades */
type IrcCourse = {
	assessment: {
		studentPersonID: number;
		sectionID: number;
		projectedGrade: string; // When isFinal === true, this field is null
		weeklyGrowth: string; // When isFinal === true, this field is the final grade
		standards: Array<{
			gradingTask: string;
			standardName: string;
			proficiencyLevel: string;
			proficiency: {
				proficiencyScore: 1 | 2 | 3 | 4;
				meetsCount: number;
				exceedsCount: number;
				approachingCount: number;
				developingCount: number;
			};
			assignments: Array<{
				activityName: string;
				scoreGroupName: string;
				score: string;
				isNotAssigned: boolean;
				standardEventActive: 0 | 1;
				isHomework: boolean;
				isMissing: boolean;
				dueDate: string; // Timestamp in format YYYY-MM-DDTHH:MM:SS
				comments: string;
			}>;
			isHomeworkStandard: boolean;
		}>;
		isFinal: boolean;
	};
	weeklyGrowth: Array<{
		studentPersonID: number;
		sectionID: number;
		task: string;
		sequence: number;
		score: 'AG' | 'MG' | 'IP';
		comments: string;
	}>;
};

// Parsed IRC Data

/** Formatted representation of an assignment */
type Assignment = {
	name: string;
	score: string;
	assigned: boolean;
	active: boolean;
	isHomework: boolean;
	isMissing: boolean;
	comments: string;
};

/** Formatted representation of a grade standard */
type Standard = {
	name: string;
	isHomeworkStandard: boolean;
	proficiencyScore: 1 | 2 | 3 | 4;
	proficiency: {
		meetsCount: number;
		exceedsCount: number;
		approachingCount: number;
		developingCount: number;
	};
	assignments: Assignment[];
};

/** Formatted representation of a course */
type Course = {
	name: string;
	projectedGrade: string;
	weeklyGrowth: string;
	standards: Standard[];
	isFinal: boolean;
};

/** Object containing all relevant grade data */
type Grades = {
	studentId: string;
	termName: string;
	courses: Course[];
};

/** Object representing the difference between two course objects */
type CourseDiff = {
	name: string;
	isFinal: boolean;
	projectedGrade?: { oldGrade: string; newGrade: string };
	newAssignments: Assignment[];
	standardScore: Array<{
		standard: string;
		oldScore: number;
		newScore: number;
	}>;
};

/** Object containing the difference between two grade objects */
type GradesDiff = {
	changes: boolean;
	termName?: { oldName: string; newName: string };
	newCourses: Course[];
	courses: CourseDiff[];
};
