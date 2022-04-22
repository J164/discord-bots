import fetch from 'node-fetch';

interface APICourseManifest {
  courseName: string;
  ebrFlag: boolean;
  sectionId: number;
}

interface APIAssignment {
  activityName: string;
  score: string;
  standardEventActive: number;
  isHomework: boolean;
  isMissing: boolean;
  comments: string;
}

export interface APIStandard {
  standardName: string;
  proficiencyLevel: string;
  isHomeworkStandard: boolean;
  proficiency: {
    proficiencyScore: number;
    exceedsCount: number;
    meetsCount: number;
    approachingCount: number;
    developingCount: number;
  };
  assignments: APIAssignment[];
}

interface APICourse {
  weeklyGrowth: {
    task: string;
    score: string;
  }[];
  assessment: {
    projectedGrade: string;
    weeklyGrowth: string;
    standards: APIStandard[];
    isFinal: boolean;
  };
}

interface Course extends APICourse {
  name: string;
}

export interface Grades {
  courses: Course[];
}

interface CourseDiff {
  isFinal?: boolean;
    projectedGrade?: { oldGrade: string; newGrade: string };
    newStandards: APIStandard[];
    newAssignments: APIAssignment[];
    standardScore?: {
      standard: string;
      oldScore: number;
      newScore: number;
    }[];
}

interface GradesDiff {
  changes: boolean;
  newCourses: Course[]
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
    ).json()) as APICourseManifest[]
  ).filter((course) => {
    if (courseIds.has(course.sectionId)) {
      return false;
    }
    courseIds.add(course.sectionId);
    return true;
  });

  return {
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
          return { ...response, name: manifest[index].courseName };
        }),
      )
    ).filter(Boolean),
  };
}

export function checkUpdates(oldGrades: Grades, newGrades: Grades): GradesDiff {
  //fixme add changes prop
  const differences: GradesDiff = { courses: [], newCourses: [] };
  for (const newCourse of newGrades.courses) {
    const oldCourse = newGrades.courses.find((value) => { return value.name === newCourse.name })
    if (!oldCourse) {
      differences.newCourses.push(newCourse)
      continue
    }
    const courseDiff: CourseDiff = { newStandards: [], newAssignments: [] }
    if (oldCourse.assessment.isFinal !== newCourse.assessment.isFinal) {
      courseDiff.isFinal = true;
    }
    if (oldCourse.assessment.projectedGrade !== newCourse.assessment.projectedGrade) {
      courseDiff.projectedGrade = { oldGrade: oldCourse.assessment.projectedGrade, newGrade: newCourse.assessment.projectedGrade };
    }
    for (const standard of newCourse.assessment.standards) {
      const oldStandard = oldCourse.assessment.standards.find((value) => {
        return value.standardName === standard.standardName;
      });
      if (!oldStandard) {
        courseDiff.newStandards.push(standard);
        continue;
      }
      if (oldStandard.proficiency.proficiencyScore !== standard.proficiency.proficiencyScore) {
        courseDiff.standardScore.push({
          standard: standard.standardName,
          oldScore: oldStandard.proficiency.proficiencyScore,
          newScore: standard.proficiency.proficiencyScore,
        });
      }
      for (const assignment of standard.assignments) {
        if (
          !oldStandard.assignments.some((value) => {
            return value.activityName === assignment.activityName;
          })
        ) {
          courseDiff.newAssignments.push(assignment);
        }
      }
    }
  }
  return differences;
}
