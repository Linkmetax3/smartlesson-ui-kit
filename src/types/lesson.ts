export const ASSESSMENT_TYPES = ["peer", "self", "teacher"] as const;
export type AssessmentType = typeof ASSESSMENT_TYPES[number];

export interface LessonActivity {
  title: string;
  description: string;
}

export interface Differentiations {
  strugglingLearners: string;
  onTrackLearners: string;
  advancedLearners: string;
  accommodations: string;
}

export interface LessonContent {
  id: string; // planId
  lessonTopic: string;
  themeOfWeek: string;
  learningObjective: string;
  materialsNeeded: string[];
  introduction: string;
  mainActivities: LessonActivity[];
  differentiations: Differentiations;
  extensionActivity: string;
  conclusion: string;
  evaluation: string;
  assessmentType: AssessmentType;
  teacherReflection: string;
  // These are from the original form, might be useful to keep or integrate
  grade?: string;
  date?: string; // YYYY-MM-DD
  learnerLevel?: "struggling" | "on-track" | "advanced";
  user_id?: string;
}

// Ordered list of keys for rendering
export const lessonContentKeys: Array<keyof Omit<LessonContent, 'id' | 'grade' | 'date' | 'learnerLevel' | 'user_id'>> = [
  'lessonTopic',
  'themeOfWeek',
  'learningObjective',
  'materialsNeeded',
  'introduction',
  'mainActivities',
  'differentiations',
  'extensionActivity',
  'conclusion',
  'evaluation',
  'assessmentType',
  'teacherReflection',
];

export const lessonSectionTitles: Record<typeof lessonContentKeys[number], string> = {
  lessonTopic: "Lesson Topic",
  themeOfWeek: "Theme of the Week",
  learningObjective: "Learning Objective(s)",
  materialsNeeded: "Materials Needed",
  introduction: "Introduction / Hook",
  mainActivities: "Main Activities",
  differentiations: "Differentiations & Support",
  extensionActivity: "Extension Activity (Optional)",
  conclusion: "Conclusion / Wrap-up",
  evaluation: "Evaluation / Check for Understanding",
  assessmentType: "Primary Assessment Type",
  teacherReflection: "Teacher Reflection (Post-Lesson)",
};
