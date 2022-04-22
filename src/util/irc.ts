import fetch from 'node-fetch';

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

interface Assignment {
  name: string;
  score: string;
  assigned: boolean;
  active: boolean;
  isHomework: boolean;
  isMissing: boolean;
  comments: string;
}

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

interface Course {
  name: string;
  projectedGrade: string;
  weeklyGrowth: string;
  standards: Standard[];
  isFinal: boolean;
}

export interface Grades {
  studentId: string;
  courses: Course[];
}

interface CourseDiff {
  name: string;
  isFinal?: boolean;
  projectedGrade?: { oldGrade: string; newGrade: string };
  newAssignments: Assignment[];
  standardScore?: {
    standard: string;
    oldScore: number;
    newScore: number;
  }[];
}

interface GradesDiff {
  changes: boolean;
  newCourses: Course[];
  courses: CourseDiff[];
}

export async function fetchCourseData(auth: { token: string; id: string; cid: string; tid: string }): Promise<Grades> {
  const courseIds = new Set<number>();

  const manifest = (
    (await (
      await fetch(`https://irc.d125.org/course/student?pid=${auth.id}&cid=${auth.cid}&tid=${auth.tid}`, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://irc.d125.org/reportcard',
          'Content-Type': 'application/json',
          DNT: '1',
          Cookie: auth.token,
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

  return {
    studentId: auth.id,
    courses: (
      await Promise.all(
        manifest.map(async (course, index) => {
          const response = (await (
            await fetch(
              `https://irc.d125.org/student/gradebookbystudent?sid=${course.sectionId}&pid=${auth.id}&isEBR=${
                course.ebrFlag ? 'true' : 'false'
              }`,
              {
                headers: {
                  Accept: 'application/json',
                  'Accept-Language': 'en-US,en;q=0.5',
                  'Accept-Encoding': 'gzip, deflate, br',
                  Referer: 'https://irc.d125.org/reportcard',
                  'Content-Type': 'application/json',
                  DNT: '1',
                  Cookie: auth.token,
                },
              },
            )
          ).json()) as APICourse;

          if (response.assessment.weeklyGrowth === null) {
            return;
          }

          return {
            name: manifest[index].courseName,
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
          };
        }),
      )
    ).filter(Boolean),
  };
}

export function checkUpdates(oldGrades: Grades, newGrades: Grades): GradesDiff {
  const differences: GradesDiff = { courses: [], newCourses: [], changes: false };
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
          !oldStandard.assignments.some((value) => {
            return value.name === newAssignment.name;
          })
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
