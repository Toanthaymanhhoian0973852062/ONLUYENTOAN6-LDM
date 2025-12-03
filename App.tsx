
import React, { useState, useEffect, useCallback } from 'react';
import {
  ChapterOutline,
  ChapterStatus,
  UserProgress,
  UserLessonProgress,
  LessonOutline,
} from './types';
import {
  loadUserProgress,
  saveUserProgress,
  getCurriculumOutline,
  saveCurriculumOutline,
} from './utils/progressStorage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LessonView from './components/LessonView';
import QuickReview from './components/QuickReview';
import { LOCAL_STORAGE_KEY_CURRICULUM } from './constants';

const App: React.FC = () => {
  const [curriculumOutline, setCurriculumOutline] = useState<ChapterOutline[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const [selectedLesson, setSelectedLesson] = useState<{
    chapterId: string;
    lessonId: string;
    chapterTitle: string;
    lessonTitle: string;
  } | null>(null);
  const [showQuickReview, setShowQuickReview] = useState(false);

  // Initialize user progress and curriculum on app load
  useEffect(() => {
    const loadedProgress = loadUserProgress();
    setUserProgress(loadedProgress);

    // Get curriculum, initializing if necessary. Pass loadedProgress for proper lock/status.
    const initialCurriculum = getCurriculumOutline(loadedProgress);
    setCurriculumOutline(initialCurriculum);

    // Set default selected lesson (first unlocked lesson)
    let defaultSelected: typeof selectedLesson = null;
    for (const chapter of initialCurriculum) {
      for (const lesson of chapter.lessons) {
        if (!lesson.isLocked) {
          defaultSelected = {
            chapterId: chapter.id,
            lessonId: lesson.id,
            chapterTitle: chapter.title,
            lessonTitle: lesson.title,
          };
          break;
        }
      }
      if (defaultSelected) break;
    }
    setSelectedLesson(defaultSelected);

    // Initial check for API Key for Veo models, though not directly used here
    // If the app were to use Veo or Gemini-3 models, this would be uncommented
    // const checkApiKey = async () => {
    //   if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
    //     console.log('API Key not selected. Opening selection dialog.');
    //     await window.aistudio.openSelectKey();
    //   }
    // };
    // checkApiKey();

  }, []);

  // Effect to save progress and curriculum whenever they change
  useEffect(() => {
    saveUserProgress(userProgress);
    saveCurriculumOutline(curriculumOutline);
  }, [userProgress, curriculumOutline]);

  // Handle lesson selection from sidebar
  const handleLessonSelect = useCallback((chapterId: string, lessonId: string) => {
    const chapter = curriculumOutline.find((c) => c.id === chapterId);
    const lesson = chapter?.lessons.find((l) => l.id === lessonId);

    if (chapter && lesson && !lesson.isLocked) {
      setSelectedLesson({
        chapterId: chapter.id,
        lessonId: lesson.id,
        chapterTitle: chapter.title,
        lessonTitle: lesson.title,
      });
    } else if (lesson?.isLocked) {
      alert('Bài học này đang bị khóa. Vui lòng hoàn thành bài trước để mở khóa.');
    }
  }, [curriculumOutline]);

  // Update lesson progress callback
  const handleLessonUpdate = useCallback(
    (chapterId: string, lessonId: string, updates: Partial<UserLessonProgress>, quizPassed?: boolean) => {
      setUserProgress((prevProgress) => {
        const newProgress = { ...prevProgress };
        if (!newProgress[chapterId]) {
          newProgress[chapterId] = {
            chapterId,
            status: ChapterStatus.NOT_STARTED,
            lessons: {},
          };
        }
        if (!newProgress[chapterId].lessons[lessonId]) {
          newProgress[chapterId].lessons[lessonId] = {
            lessonId,
            progress: 0,
            quizScore: null,
            quizPassed: false,
            attemptedPracticeProblems: [],
            weakAreas: [],
            lastAccessed: Date.now(),
          };
        }
        Object.assign(newProgress[chapterId].lessons[lessonId], updates);

        // Update chapter status
        const chapter = newProgress[chapterId];
        const allLessons = curriculumOutline.find(c => c.id === chapterId)?.lessons || [];
        const completedLessonsCount = allLessons.filter(lesson => chapter.lessons[lesson.id]?.quizPassed).length;

        if (completedLessonsCount === allLessons.length && allLessons.length > 0) {
            chapter.status = ChapterStatus.COMPLETED;
        } else if (completedLessonsCount > 0 || Object.keys(chapter.lessons).length > 0) {
            chapter.status = ChapterStatus.IN_PROGRESS;
        } else {
            chapter.status = ChapterStatus.NOT_STARTED;
        }
        return newProgress;
      });

      // Also update curriculumOutline for UI
      setCurriculumOutline((prevOutline) => {
        const newOutline = prevOutline.map((chapter) => {
          if (chapter.id === chapterId) {
            const newLessons = chapter.lessons.map((lesson) => {
              if (lesson.id === lessonId) {
                return { ...lesson, ...updates };
              }
              return lesson;
            });

            // Re-evaluate chapter status for the outline
            const updatedChapterStatus = newLessons.every(
              (lesson) => userProgress[chapterId]?.lessons[lesson.id]?.quizPassed,
            ) ? ChapterStatus.COMPLETED : newLessons.some((lesson) => lesson.progress > 0) ? ChapterStatus.IN_PROGRESS : ChapterStatus.NOT_STARTED;

            return { ...chapter, lessons: newLessons, status: updatedChapterStatus };
          }
          return chapter;
        });
        return newOutline;
      });
    },
    [userProgress, curriculumOutline],
  );

  // Callback to unlock the next lesson
  const handleUnlockNextLesson = useCallback(
    (currentChapterId: string, currentLessonId: string) => {
      setCurriculumOutline((prevOutline) => {
        const newOutline = prevOutline.map((chapter) => {
          if (chapter.id === currentChapterId) {
            const currentLessonIndex = chapter.lessons.findIndex(
              (l) => l.id === currentLessonId,
            );
            if (currentLessonIndex !== -1 && currentLessonIndex < chapter.lessons.length - 1) {
              const nextLesson = chapter.lessons[currentLessonIndex + 1];
              if (nextLesson.isLocked) {
                // Only unlock if it's currently locked
                const updatedLessons = chapter.lessons.map((lesson, idx) =>
                  idx === currentLessonIndex + 1 ? { ...lesson, isLocked: false } : lesson,
                );
                return { ...chapter, lessons: updatedLessons };
              }
            }
          }
          return chapter;
        });
        return newOutline;
      });
    },
    [],
  );

  const handleQuickReviewClick = useCallback(() => {
    setShowQuickReview(true);
  }, []);

  const handleCloseQuickReview = useCallback(() => {
    setShowQuickReview(false);
  }, []);

  return (
    <div className="flex h-screen bg-bg-light">
      <Header onQuickReviewClick={handleQuickReviewClick} />
      <Sidebar
        curriculum={curriculumOutline}
        onLessonSelect={handleLessonSelect}
        selectedLessonId={selectedLesson?.lessonId || null}
      />
      <main className="flex-1 ml-64 pt-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {selectedLesson ? (
            <LessonView
              key={selectedLesson.lessonId} // Key to force re-render when lesson changes
              chapterId={selectedLesson.chapterId}
              lessonId={selectedLesson.lessonId}
              chapterTitle={selectedLesson.chapterTitle}
              lessonTitle={selectedLesson.lessonTitle}
              userLessonProgress={userProgress[selectedLesson.chapterId]?.lessons[selectedLesson.lessonId]}
              onLessonUpdate={handleLessonUpdate}
              onUnlockNextLesson={handleUnlockNextLesson}
            />
          ) : (
            <div className="p-8 text-center text-gray-600">
              <h2 className="text-2xl font-semibold mb-4">Chào mừng bạn đến với Toán 6!</h2>
              <p>Vui lòng chọn một bài học từ danh sách bên trái để bắt đầu.</p>
            </div>
          )}
        </div>
      </main>

      {showQuickReview && <QuickReview onClose={handleCloseQuickReview} />}
    </div>
  );
};

export default App;
