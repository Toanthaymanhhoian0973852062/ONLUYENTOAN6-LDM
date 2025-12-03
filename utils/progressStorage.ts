
import { UserProgress, ChapterOutline, ChapterStatus } from '../types';
import { CURRICULUM_OUTLINE, LOCAL_STORAGE_KEY_PROGRESS, LOCAL_STORAGE_KEY_CURRICULUM } from '../constants';

/**
 * Loads user progress from local storage.
 * If no progress is found, initializes a default progress structure.
 */
export const loadUserProgress = (): UserProgress => {
  try {
    const storedProgress = localStorage.getItem(LOCAL_STORAGE_KEY_PROGRESS);
    if (storedProgress) {
      return JSON.parse(storedProgress) as UserProgress;
    }
  } catch (error) {
    console.error('Error loading user progress from local storage:', error);
  }
  return {}; // Return empty object if no progress or error
};

/**
 * Saves user progress to local storage.
 */
export const saveUserProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving user progress to local storage:', error);
  }
};

/**
 * Initializes the curriculum outline, updating statuses and lock states based on user progress.
 */
export const initializeCurriculumOutline = (userProgress: UserProgress): ChapterOutline[] => {
  const initialOutline: ChapterOutline[] = JSON.parse(JSON.stringify(CURRICULUM_OUTLINE)); // Deep copy

  initialOutline.forEach((chapter) => {
    const userChapter = userProgress[chapter.id];

    if (userChapter) {
      // Update chapter status
      chapter.status = userChapter.status;

      // Update lesson progress and lock status
      chapter.lessons.forEach((lesson, index) => {
        const userLesson = userChapter.lessons[lesson.id];
        if (userLesson) {
          lesson.progress = userLesson.progress;
          lesson.isLocked = userLesson.quizPassed ? false : lesson.isLocked; // If quiz passed, it's unlocked
        }

        // Unlock the first lesson of each chapter if the chapter is not started
        if (index === 0 && chapter.status === ChapterStatus.NOT_STARTED && !lesson.isLocked) {
          lesson.isLocked = false;
        }

        // Unlock next lesson if previous one is passed
        if (index > 0) {
          const prevLesson = chapter.lessons[index - 1];
          const prevUserLesson = userChapter.lessons[prevLesson.id];
          if (prevUserLesson?.quizPassed) {
            lesson.isLocked = false;
          }
        }
      });
    }

    // Ensure the first lesson of the very first chapter is always unlocked
    if (chapter.id === initialOutline[0].id && chapter.lessons.length > 0) {
      chapter.lessons[0].isLocked = false;
    }
  });

  return initialOutline;
};

/**
 * Gets the current curriculum outline from local storage or initializes it.
 */
export const getCurriculumOutline = (userProgress: UserProgress): ChapterOutline[] => {
    try {
        const storedOutline = localStorage.getItem(LOCAL_STORAGE_KEY_CURRICULUM);
        if (storedOutline) {
            return JSON.parse(storedOutline) as ChapterOutline[];
        }
    } catch (error) {
        console.error('Error loading curriculum outline from local storage:', error);
    }
    // If not found or error, initialize and save
    const initializedOutline = initializeCurriculumOutline(userProgress);
    saveCurriculumOutline(initializedOutline);
    return initializedOutline;
};


/**
 * Saves the current curriculum outline to local storage.
 */
export const saveCurriculumOutline = (outline: ChapterOutline[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CURRICULUM, JSON.stringify(outline));
  } catch (error) {
    console.error('Error saving curriculum outline to local storage:', error);
  }
};
