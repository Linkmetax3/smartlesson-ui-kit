
export interface QuizQuestion {
  id?: string; // Optional: for client-side keying or if questions have their own IDs
  question: string;
  choices: string[];
  answer: string; // This should be one of the choices, e.g., "A", "B", or the actual text of the choice.
}

export interface Quiz {
  id: string; // Corresponds to the ID in the 'quizzes' table (quizId)
  plan_id: string;
  content: QuizQuestion[];
  parameters?: { // Store original generation parameters if needed
    learnerLevel: LearnerLevel;
    numQuestions: number;
    topics: string[];
  };
  created_at?: string;
}

export type LearnerLevel = "struggling" | "on-track" | "advanced";

export const learnerLevels: LearnerLevel[] = ["struggling", "on-track", "advanced"];

