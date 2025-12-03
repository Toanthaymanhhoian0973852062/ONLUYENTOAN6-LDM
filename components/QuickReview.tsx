
import React, { useState, useEffect, useCallback } from 'react';
import { QuickReviewQuestion } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { getQuickReviewQuestions } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface QuickReviewProps {
  onClose: () => void;
}

const QuickReview: React.FC<QuickReviewProps> = ({ onClose }) => {
  const [questions, setQuestions] = useState<QuickReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    setUserAnswers({});
    setScore(null);
    try {
      const fetchedQuestions = await getQuickReviewQuestions();
      setQuestions(fetchedQuestions);
    } catch (err: any) {
      console.error('Failed to fetch quick review questions:', err);
      setError(err.message || 'Không thể tải câu hỏi ôn tập nhanh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    let currentScore = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setShowResults(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải câu hỏi</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex justify-end gap-2">
            <Button onClick={fetchQuestions} variant="primary">
              Thử lại
            </Button>
            <Button onClick={onClose} variant="outline">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-semibold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-primary mb-6">Ôn nhanh 5 phút</h2>

        {questions.length === 0 ? (
          <p className="text-gray-600 text-center">Không có câu hỏi nào để ôn tập.</p>
        ) : (
          <div>
            {questions.map((q, index) => (
              <div key={q.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="font-semibold text-lg mb-2">
                  Câu {index + 1} ({q.topic}): <MarkdownRenderer content={q.question} />
                </p>
                {q.options && (
                  <div className="flex flex-col space-y-2">
                    {q.options.map((option) => (
                      <label key={option.key} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`quick_review_question_${q.id}`}
                          value={option.key}
                          checked={userAnswers[q.id] === option.key}
                          onChange={() => handleAnswerChange(q.id, option.key)}
                          disabled={showResults}
                          className="form-radio h-4 w-4 text-primary mr-2"
                        />
                        <span className="text-base">
                          {option.key}. {option.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {showResults && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium">
                      Đáp án của bạn: <span className={userAnswers[q.id] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}>
                        {userAnswers[q.id] || 'Chưa trả lời'}
                      </span>
                    </p>
                    {userAnswers[q.id] !== q.correctAnswer && (
                      <p className="font-medium text-green-600">
                        Đáp án đúng: {q.correctAnswer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!showResults && (
              <Button onClick={handleSubmit} className="mt-4 w-full">
                Nộp bài và xem kết quả
              </Button>
            )}

            {showResults && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-xl font-bold text-blue-800 mb-2">
                  Bạn đạt được {score} / {questions.length} điểm!
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Button onClick={fetchQuestions} variant="primary">
                    Làm lại
                  </Button>
                  <Button onClick={onClose} variant="outline">
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickReview;
