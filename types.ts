
export enum ChapterStatus {
  NOT_STARTED = 'Chưa học',
  IN_PROGRESS = 'Đang học',
  COMPLETED = 'Đã hoàn thành',
}

export interface LessonOutline {
  id: string;
  title: string;
  progress: number; // 0-100%
  isLocked: boolean;
}

export interface ChapterOutline {
  id: string;
  title: string;
  status: ChapterStatus;
  lessons: LessonOutline[];
}

export interface TheoryContent {
  text: string;
  illustrations?: string[]; // Descriptions for images
}

export interface ExampleProblem {
  title: string;
  problem: string;
  solution: string;
  commonMistakes: string;
}

export interface PracticeProblem {
  problem: string;
  answer: string;
}

export type QuizQuestionType = 'multiple_choice' | 'short_answer';

export interface MultipleChoiceOption {
  key: string; // e.g., 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: MultipleChoiceOption[]; // For multiple choice
  correctAnswer: string; // For short answer or key for multiple choice
}

export interface LessonContent {
  theory: TheoryContent;
  examples: ExampleProblem[];
  practiceProblems: PracticeProblem[];
  quiz: QuizQuestion[];
  nextSteps: string; // General suggestion
}

export interface UserLessonProgress {
  lessonId: string;
  progress: number; // 0-100%
  quizScore: number | null; // Null if not taken
  quizPassed: boolean;
  attemptedPracticeProblems: string[]; // Store IDs or problem text? Simpler for now: just completion status
  weakAreas: string[]; // Topics the user struggles with
  lastAccessed: number; // Timestamp
}

export interface UserChapterProgress {
  chapterId: string;
  status: ChapterStatus;
  lessons: { [lessonId: string]: UserLessonProgress };
}

export interface UserProgress {
  [chapterId: string]: UserChapterProgress;
}

// For Gemini API
export interface GeneratedLessonData {
  theory: TheoryContent;
  examples: ExampleProblem[];
  practiceProblems: PracticeProblem[];
  quiz: QuizQuestion[];
  nextSteps: string;
}

export interface QuickReviewQuestion {
  id: string;
  question: string;
  options?: MultipleChoiceOption[];
  correctAnswer: string;
  topic: string; // To help categorize for weak areas
}
