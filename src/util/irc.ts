/**
 * Response from IRC provided after successful authentication
 */
interface APIAuthenticate {
  personId: number;
}

/**
 * IRC API data representing a term
 */
interface APITerm {
  calendarId: number;
  termId: number;
  termName: string;
}

/**
 * IRC API data providing an overview of a course
 */
interface APIManifestEntry {
  courseId: number;
  courseName: string;
  courseNumber: string;
  ebrFlag: boolean;
  sectionId: number; //used to make requests and identify courses
  periodId: number;
  teacherDisplay: string;
  teacherPersonID: number;
  periodName: `${'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'}${'A' | 'B'}` | 'ACT';
  periodStart: string; // timestamp in format YYYY-MM-DDTHH:MM:SS (date is always 1900-01-01)
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  isDropped: 0 | 1;
}

/**
 * IRC API data representing a course's grades
 */
interface APICourse {
  assessment: {
    studentPersonID: number;
    sectionID: number;
    projectedGrade: string; // when isFinal === true, this field is null
    weeklyGrowth: string; // when isFinal === true, this field is the final grade
    standards: {
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
      assignments: {
        activityName: string;
        scoreGroupName: string;
        score: string;
        isNotAssigned: boolean;
        standardEventActive: 0 | 1;
        isHomework: boolean;
        isMissing: boolean;
        dueDate: string; // timestamp in format YYYY-MM-DDTHH:MM:SS
        comments: string;
      }[];
      isHomeworkStandard: boolean;
    }[];
    isFinal: boolean;
  };
  weeklyGrowth: {
    studentPersonID: number;
    sectionID: number;
    task: string;
    sequence: number;
    score: 'AG' | 'MG' | 'IP';
    comments: string;
  }[];
}

/**
 * IRC API data representing an assignment
 */
interface Assignment {
  name: string;
  score: string;
  assigned: boolean;
  active: boolean;
  isHomework: boolean;
  isMissing: boolean;
  comments: string;
}

/**
 * Formatted representation of a grade standard
 */
export interface Standard {
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
}

/**
 * Formatted representation of a course
 */
interface Course {
  name: string;
  projectedGrade: string;
  weeklyGrowth: string;
  standards: Standard[];
  isFinal: boolean;
}

/**
 * Object containing all relevant grade data
 */
export interface Grades {
  studentId: string;
  termName: string;
  courses: Course[];
}

/**
 * Object representing the difference between two course objects
 */
interface CourseDiff {
  name: string;
  isFinal?: boolean;
  projectedGrade?: { oldGrade: string; newGrade: string };
  newAssignments: Assignment[];
  standardScore: {
    standard: string;
    oldScore: number;
    newScore: number;
  }[];
}

/**
 * Object containing the difference between two grade objects
 */
interface GradesDiff {
  changes: boolean;
  termName?: { oldName: string; newName: string };
  newCourses: Course[];
  courses: CourseDiff[];
}

/**
 * Authenticates with IRC, requests, and formats all relevent data
 * @param token IRC login token
 * @returns a promise containing the formatted response or null if the request failed
 */
export async function fetchCourseData(token: string): Promise<Grades | null> {
  const response = await fetch('https://irc.d125.org/users/authenticate', {
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

  if (response.status === 400) {
    return null;
  }

  const authenticate = (await response.json()) as APIAuthenticate;

  const terms = (await (
    await fetch('https://irc.d125.org/course/terms', {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://irc.d125.org/reportcard',
        'Content-Type': 'application/json',
        DNT: '1',
        Cookie: token,
      },
    })
  ).json()) as APITerm[];

  const courseIds = new Set<number>();

  const manifest = (
    (await (
      await fetch(`https://irc.d125.org/course/student?pid=${authenticate.personId}&cid=${terms[0].calendarId}&tid=${terms[0].termId}`, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://irc.d125.org/reportcard',
          'Content-Type': 'application/json',
          DNT: '1',
          Cookie: token,
        },
      })
    ).json()) as APIManifestEntry[]
  ).filter((course) => {
    if (courseIds.has(course.sectionId)) {
      return false;
    }
    courseIds.add(course.sectionId);
    return true;
  });

  const courses = [];
  for (const course of manifest) {
    const response = (await (
      await fetch(
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
      )
    ).json()) as APICourse;

    if (response.assessment.weeklyGrowth === null) {
      continue;
    }

    courses.push({
      name: course.courseName,
      projectedGrade: response.assessment.projectedGrade,
      weeklyGrowth: response.assessment.weeklyGrowth,
      standards: response.assessment.standards.map((standard) => {
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
              active: assignment.standardEventActive === 1 ? true : false,
              isHomework: assignment.isHomework,
              isMissing: assignment.isMissing,
              comments: assignment.comments,
            };
          }),
        };
      }),
      isFinal: response.assessment.isFinal,
    });
  }

  return {
    studentId: authenticate.personId.toString(),
    termName: terms[0].termName,
    courses: courses,
  };
}

/**
 * Compares two sets of grades to check for updates
 * @param oldGrades the original set of grades to compare to
 * @param newGrades the new set of grades to compare with
 * @returns an object representing the difference between the two sets of grades
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
    const courseDiff: CourseDiff = { newAssignments: [], standardScore: [], name: newCourse.name };
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
    if (courseDiff.isFinal || courseDiff.newAssignments.length > 0 || courseDiff.projectedGrade || courseDiff.standardScore.length > 0) {
      differences.courses.push(courseDiff);
    }
  }
  if (differences.courses.length > 0 || differences.newCourses.length > 0) {
    differences.changes = true;
  }
  return differences;
}
