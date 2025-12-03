
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LessonContent,
  QuizQuestion,
  PracticeProblem,
  UserLessonProgress,
  ChapterOutline,
  ChapterStatus,
  LessonOutline,
  QuizQuestionType,
  MultipleChoiceOption,
} from '../types';
import Button from './Button';
import MarkdownRenderer from './MarkdownRenderer';
import { getLessonContent, getQuizFeedback } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { QUIZ_PASS_SCORE } from '../constants';

interface LessonViewProps {
  chapterId: string;
  lessonId: string;
  chapterTitle: string;
  lessonTitle: string;
  userLessonProgress: UserLessonProgress | undefined;
  onLessonUpdate: (
    chapterId: string,
    lessonId: string,
    progress: Partial<UserLessonProgress>,
    quizPassed?: boolean,
  ) => void;
  onUnlockNextLesson: (chapterId: string, lessonId: string) => void;
}

const LessonView: React.FC<LessonViewProps> = ({
  chapterId,
  lessonId,
  chapterTitle,
  lessonTitle,
  userLessonProgress,
  onLessonUpdate,
  onUnlockNextLesson,
}) => {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'theory' | 'examples' | 'practice' | 'quiz' | 'feedback'>(
    'theory',
  );
  const [userQuizAnswers, setUserQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [showPracticeAnswers, setShowPracticeAnswers] = useState(false);

  const currentLessonProgress = userLessonProgress || {
    lessonId,
    progress: 0,
    quizScore: null,
    quizPassed: false,
    attemptedPracticeProblems: [],
    weakAreas: [],
    lastAccessed: Date.now(),
  };

  const fetchLessonContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cachedContent = localStorage.getItem(`lesson_content_${lessonId}`);
      if (cachedContent) {
        setContent(JSON.parse(cachedContent) as LessonContent);
        setLoading(false);
      } else {
        const generatedContent = await getLessonContent(chapterTitle, lessonTitle);
        setContent(generatedContent);
        localStorage.setItem(`lesson_content_${lessonId}`, JSON.stringify(generatedContent));
        setLoading(false);
      }
      onLessonUpdate(chapterId, lessonId, { progress: 25, lastAccessed: Date.now() }); // Mark as started
    } catch (err: any) {
      console.error('Failed to fetch lesson content:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải nội dung bài học.');
      setLoading(false);
    }
  }, [chapterId, lessonId, chapterTitle, lessonTitle, onLessonUpdate]);

  useEffect(() => {
    fetchLessonContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]); // Re-fetch when lessonId changes

  useEffect(() => {
    // Restore quiz answers if quiz was previously taken but not finished/submitted
    if (content && currentLessonProgress.quizScore === null) {
      const storedAnswers = localStorage.getItem(`quiz_answers_${lessonId}`);
      if (storedAnswers) {
        setUserQuizAnswers(JSON.parse(storedAnswers));
      } else {
        setUserQuizAnswers({}); // Clear for a new attempt
      }
    } else if (currentLessonProgress.quizScore !== null) {
      setQuizScore(currentLessonProgress.quizScore);
      setActiveTab('feedback');
    }
  }, [lessonId, content, currentLessonProgress.quizScore]);

  const handleQuizAnswerChange = useCallback(
    (questionId: string, answer: string) => {
      const newAnswers = { ...userQuizAnswers, [questionId]: answer };
      setUserQuizAnswers(newAnswers);
      localStorage.setItem(`quiz_answers_${lessonId}`, JSON.stringify(newAnswers));
    },
    [userQuizAnswers, lessonId],
  );

  const handleSubmitQuiz = useCallback(async () => {
    if (!content) return;

    let score = 0;
    const incorrectQuestions: QuizQuestion[] = [];
    content.quiz.forEach((q) => {
      if (userQuizAnswers[q.id] === q.correctAnswer) {
        score++;
      } else {
        incorrectQuestions.push(q);
      }
    });

    setQuizScore(score);

    const quizPassed = score >= QUIZ_PASS_SCORE;
    onLessonUpdate(
      chapterId,
      lessonId,
      {
        progress: quizPassed ? 100 : currentLessonProgress.progress, // Only set to 100% if quiz passed
        quizScore: score,
        quizPassed: quizPassed,
        lastAccessed: Date.now(),
      },
      quizPassed, // Pass quizPassed directly to update curriculum
    );

    if (quizPassed) {
      onUnlockNextLesson(chapterId, lessonId); // Unlock the next lesson
    }

    // Generate feedback
    setLoading(true);
    const feedback = await getQuizFeedback(content.quiz, userQuizAnswers, score);
    setQuizFeedback(feedback);
    setLoading(false);

    localStorage.removeItem(`quiz_answers_${lessonId}`); // Clear stored answers after submission
    setActiveTab('feedback');
  }, [
    content,
    userQuizAnswers,
    onLessonUpdate,
    chapterId,
    lessonId,
    currentLessonProgress.progress,
    onUnlockNextLesson,
  ]);

  const handleRetakeQuiz = useCallback(() => {
    setUserQuizAnswers({});
    setQuizScore(null);
    setQuizFeedback(null);
    localStorage.removeItem(`quiz_answers_${lessonId}`);
    onLessonUpdate(chapterId, lessonId, { quizScore: null, quizPassed: false }); // Reset quiz state
    setActiveTab('quiz');
  }, [chapterId, lessonId, onLessonUpdate]);

  const progressPercentage = useMemo(() => {
    if (currentLessonProgress.quizPassed) return 100;
    if (currentLessonProgress.quizScore !== null) return 75; // Quiz attempted
    if (activeTab === 'practice') return 50;
    if (activeTab === 'examples') return 25;
    return 0; // Default or theory
  }, [activeTab, currentLessonProgress.quizPassed, currentLessonProgress.quizScore]);

  useEffect(() => {
    // Update parent progress if activeTab changes
    onLessonUpdate(chapterId, lessonId, { progress: progressPercentage, lastAccessed: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercentage]);


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg">
        <p className="font-semibold text-lg">Lỗi:</p>
        <p>{error}</p>
        <Button onClick={fetchLessonContent} className="mt-4">
          Thử tải lại
        </Button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p className="text-lg">Không có nội dung cho bài học này.</p>
      </div>
    );
  }

  const renderTheory = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-primary mb-4">
        (1) Lý thuyết cần nhớ
      </h2>
      <MarkdownRenderer content={content.theory.text} />
      {content.theory.illustrations && content.theory.illustrations.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.theory.illustrations.map((desc, index) => (
            <div key={index} className="flex flex-col items-center">
              <img
                src={`https://picsum.photos/400/250?random=${lessonId}-${index}`}
                alt={desc}
                className="rounded-lg shadow-sm"
              />
              <p className="text-sm text-gray-600 mt-2 italic">{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExamples = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-primary mb-4">
        (2) Ví dụ minh họa cho từng dạng bài
      </h2>
      {content.examples.map((example, index) => (
        <div key={index} className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="text-xl font-semibold text-secondary mb-2">{example.title}</h3>
          <p className="font-medium mb-2">
            *Ví dụ mẫu:* <MarkdownRenderer content={example.problem} />
          </p>
          <div className="bg-blue-100 p-3 rounded-md mb-2">
            <p className="font-medium text-blue-800">Lời giải chi tiết:</p>
            <MarkdownRenderer content={example.solution} />
          </div>
          <div className="bg-red-100 p-3 rounded-md">
            <p className="font-medium text-red-800">Sai lầm thường gặp:</p>
            <MarkdownRenderer content={example.commonMistakes} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderPractice = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-primary mb-4">
        (3) Bài tập tự luyện
      </h2>
      {content.practiceProblems.map((problem, index) => (
        <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md">
          <p className="font-semibold text-base mb-1">Bài {index + 1}:</p>
          <MarkdownRenderer content={problem.problem} />
          {showPracticeAnswers && (
            <div className="mt-2 text-green-700 font-medium">
              Đáp án: <MarkdownRenderer content={problem.answer} />
            </div>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => setShowPracticeAnswers(!showPracticeAnswers)}
        className="mt-4"
      >
        {showPracticeAnswers ? 'Ẩn đáp án' : 'Hiển thị đáp án'}
      </Button>
    </div>
  );

  const renderQuiz = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-primary mb-4">
        (4) Bài kiểm tra
      </h2>
      {content.quiz.map((q, index) => (
        <div key={q.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="font-semibold text-lg mb-2">
            Câu {index + 1}: <MarkdownRenderer content={q.question} />
          </p>
          {q.type === 'multiple_choice' && q.options && (
            <div className="flex flex-col space-y-2">
              {q.options.map((option) => (
                <label key={option.key} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${q.id}`}
                    value={option.key}
                    checked={userQuizAnswers[q.id] === option.key}
                    onChange={() => handleQuizAnswerChange(q.id, option.key)}
                    className="form-radio h-4 w-4 text-primary mr-2"
                  />
                  <span className="text-base">
                    {option.key}. {option.text}
                  </span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'short_answer' && (
            <input
              type="text"
              value={userQuizAnswers[q.id] || ''}
              onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
              className="mt-2 p-2 border border-gray-300 rounded-md w-full focus:ring-primary focus:border-primary"
              placeholder="Nhập câu trả lời của bạn"
            />
          )}
        </div>
      ))}
      <Button onClick={handleSubmitQuiz} className="mt-6 w-full" disabled={loading}>
        {loading ? 'Đang chấm điểm...' : 'Nộp bài kiểm tra'}
      </Button>
    </div>
  );

  const renderFeedback = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-primary mb-4">
        (5) Kết quả và Gợi ý lộ trình tiếp theo
      </h2>
      {quizScore !== null && (
        <>
          <p className="text-xl font-semibold mb-3">
            Điểm của bạn: <span className={quizScore >= QUIZ_PASS_SCORE ? 'text-green-600' : 'text-red-600'}>
              {quizScore} / {content?.quiz.length}
            </span>
          </p>
          {quizScore >= QUIZ_PASS_SCORE ? (
            <p className="text-green-700 font-medium mb-4">
              Chúc mừng! Bạn đã đạt yêu cầu để mở khóa bài học tiếp theo.
            </p>
          ) : (
            <p className="text-red-700 font-medium mb-4">
              Bạn chưa đạt yêu cầu. Vui lòng xem lại lý thuyết, ví dụ và làm lại bài kiểm tra.
            </p>
          )}
          {loading ? (
            <LoadingSpinner />
          ) : (
            quizFeedback && (
              <div className="bg-gray-50 p-4 rounded-md mt-4">
                <h3 className="text-xl font-semibold text-secondary mb-2">Gợi ý từ AI:</h3>
                <MarkdownRenderer content={quizFeedback} />
              </div>
            )
          )}
          <div className="mt-6 flex flex-wrap gap-4">
            <Button onClick={handleRetakeQuiz} variant="secondary">
              Làm lại bài kiểm tra
            </Button>
            <Button onClick={() => setActiveTab('theory')} variant="outline">
              Xem lại lý thuyết
            </Button>
            <Button onClick={() => setActiveTab('examples')} variant="outline">
              Hiển thị ví dụ mẫu
            </Button>
          </div>
        </>
      )}
      <div className="bg-gray-50 p-4 rounded-md mt-6">
          <h3 className="text-xl font-semibold text-primary mb-2">Gợi ý chung:</h3>
          <MarkdownRenderer content={content.nextSteps} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-8">
        <h1 className="text-3xl font-bold text-text-dark mb-6">{lessonTitle}</h1>

        <div className="sticky top-16 bg-bg-light z-10 py-4 mb-6 -mx-8 px-8 border-b border-gray-200 shadow-sm">
          <nav className="flex space-x-2 md:space-x-4 overflow-x-auto whitespace-nowrap">
            <Button
              variant={activeTab === 'theory' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('theory')}
              size="sm"
            >
              Lý thuyết
            </Button>
            <Button
              variant={activeTab === 'examples' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('examples')}
              size="sm"
            >
              Ví dụ
            </Button>
            <Button
              variant={activeTab === 'practice' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('practice')}
              size="sm"
            >
              Bài tập
            </Button>
            <Button
              variant={activeTab === 'quiz' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('quiz')}
              size="sm"
            >
              Kiểm tra
            </Button>
            {quizScore !== null && (
              <Button
                variant={activeTab === 'feedback' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('feedback')}
                size="sm"
              >
                Kết quả
              </Button>
            )}
          </nav>
        </div>

        <div>
          {activeTab === 'theory' && renderTheory()}
          {activeTab === 'examples' && renderExamples()}
          {activeTab === 'practice' && renderPractice()}
          {activeTab === 'quiz' && renderQuiz()}
          {activeTab === 'feedback' && renderFeedback()}
        </div>
      </div>
    </div>
  );
};

export default LessonView;
