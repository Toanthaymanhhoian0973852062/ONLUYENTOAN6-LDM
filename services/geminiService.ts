
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GeneratedLessonData, QuizQuestionType, QuickReviewQuestion, QuizQuestion } from '../types';
import { GEMINI_MODEL } from '../constants';

interface GeminiServiceError {
  message: string;
  statusCode?: number;
}

const parseGeminiResponse = (text: string): GeneratedLessonData => {
  try {
    // Attempt to parse as JSON first
    const data = JSON.parse(text);
    return data;
  } catch (jsonError) {
    console.warn("Gemini response is not valid JSON, attempting markdown parsing:", jsonError);
    // Fallback to simpler markdown parsing if JSON fails (less robust)
    const sections = text.split('### ').slice(1); // Split by section headers
    const lessonData: Partial<GeneratedLessonData> = {};

    sections.forEach(section => {
      if (section.startsWith('(1) Lý thuyết cần nhớ')) {
        lessonData.theory = { text: section.substring(section.indexOf('\n')).trim() };
      } else if (section.startsWith('(2) Ví dụ minh họa')) {
        const examplesText = section.substring(section.indexOf('\n')).trim();
        const exampleBlocks = examplesText.split('--- Dạng bài mới ---').filter(Boolean);
        lessonData.examples = exampleBlocks.map(block => {
          const titleMatch = block.match(/\*\*Tên dạng bài:\*\*\s*(.*?)\n/);
          const problemMatch = block.match(/\*\*Ví dụ mẫu:\*\*\s*(.*?)\n/s);
          const solutionMatch = block.match(/\*\*Lời giải chi tiết:\*\*\s*(.*?)\n\s*\*\*Sai lầm thường gặp:\*\*/s);
          const mistakesMatch = block.match(/\*\*Sai lầm thường gặp:\*\*\s*(.*)/s);

          return {
            title: titleMatch ? titleMatch[1].trim() : 'Dạng bài',
            problem: problemMatch ? problemMatch[1].trim() : 'N/A',
            solution: solutionMatch ? solutionMatch[1].trim() : 'N/A',
            commonMistakes: mistakesMatch ? mistakesMatch[1].trim() : 'N/A',
          };
        });
      } else if (section.startsWith('(3) Bài tập tự luyện')) {
        const practiceText = section.substring(section.indexOf('\n')).trim();
        const problems = practiceText.split('\n').filter(line => line.startsWith('- **Bài')).map(line => {
          const parts = line.split('| Đáp án:');
          return {
            problem: parts[0].replace(/^- \*\*Bài \d+:\*\*\s*/, '').trim(),
            answer: parts[1] ? parts[1].trim() : 'Chưa có đáp án',
          };
        });
        lessonData.practiceProblems = problems;
      } else if (section.startsWith('(4) Bài kiểm tra')) {
        const quizText = section.substring(section.indexOf('\n')).trim();
        const questions = quizText.split('\n- **Câu ').slice(1).map((qBlock, index) => {
          const lines = qBlock.split('\n').map(l => l.trim()).filter(Boolean);
          const questionMatch = lines[0].match(/^\d+:\*\*\s*(.*)/);
          const questionText = questionMatch ? questionMatch[1].trim() : `Câu hỏi ${index + 1}`;
          const options: { key: string; text: string }[] = [];
          let correctAnswer = '';
          let isMultipleChoice = false;

          for (let i = 1; i < lines.length; i++) {
            if (lines[i].startsWith('A.') || lines[i].startsWith('B.') || lines[i].startsWith('C.') || lines[i].startsWith('D.')) {
              isMultipleChoice = true;
              options.push({ key: lines[i].charAt(0), text: lines[i].substring(2).trim() });
            } else if (lines[i].startsWith('Đáp án:')) {
              correctAnswer = lines[i].substring('Đáp án:'.length).trim();
            }
          }

          return {
            id: `quiz-q-${index + 1}`,
            type: isMultipleChoice ? 'multiple_choice' as QuizQuestionType : 'short_answer' as QuizQuestionType,
            question: questionText,
            options: isMultipleChoice ? options : undefined,
            correctAnswer: correctAnswer,
          };
        });
        lessonData.quiz = questions;
      } else if (section.startsWith('(5) Gợi ý lộ trình tiếp theo')) {
        lessonData.nextSteps = section.substring(section.indexOf('\n')).trim();
      }
    });

    // Basic validation and default values for robustness
    if (!lessonData.theory) lessonData.theory = { text: "Nội dung lý thuyết đang được cập nhật." };
    if (!lessonData.examples) lessonData.examples = [];
    if (!lessonData.practiceProblems) lessonData.practiceProblems = [];
    if (!lessonData.quiz) lessonData.quiz = [];
    if (!lessonData.nextSteps) lessonData.nextSteps = "Tiếp tục bài học kế tiếp!";

    return lessonData as GeneratedLessonData;
  }
};


export const getLessonContent = async (chapterTitle: string, lessonTitle: string): Promise<GeneratedLessonData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Bạn là một giáo viên Toán lớp 6, có kiến thức sâu rộng về chương trình 'Kết nối tri thức'. Vui lòng tạo nội dung chi tiết cho bài học "${lessonTitle}" thuộc "${chapterTitle}" với cấu trúc sau, sử dụng ngôn ngữ rõ ràng, dễ hiểu và thân thiện với học sinh lớp 6. Trả lời bằng tiếng Việt.

Sử dụng định dạng Markdown cho tiêu đề và định dạng nội dung, ví dụ: **Lý thuyết cần nhớ**, *Ví dụ mẫu*.

### (1) Lý thuyết cần nhớ
Viết ngắn gọn, dễ hiểu. Highlight các công thức, tính chất quan trọng bằng in đậm.
Mô tả 1-2 hình minh hoạ (ví dụ: "Hình ảnh một nhóm học sinh đang thảo luận bài tập", "Sơ đồ venn biểu diễn các tập hợp số").

### (2) Ví dụ minh họa cho từng dạng bài
Cung cấp 2 dạng bài tiêu biểu cho chủ đề này. Với mỗi dạng:
- **Tên dạng bài:** [Tên dạng]
- **Ví dụ mẫu:** [Đề bài]
- **Lời giải chi tiết:** [Các bước giải từng bước, rõ ràng]
- **Sai lầm thường gặp:** [Mô tả chi tiết sai lầm và cách khắc phục]
--- Dạng bài mới ---
- **Tên dạng bài:** [Tên dạng thứ hai]
- **Ví dụ mẫu:** [Đề bài]
- **Lời giải chi tiết:** [Các bước giải từng bước, rõ ràng]
- **Sai lầm thường gặp:** [Mô tả chi tiết sai lầm và cách khắc phục]

### (3) Bài tập tự luyện
Tạo 10 bài tập tự luyện từ cơ bản đến nâng cao. Chỉ cung cấp đề bài và đáp án cuối cùng.
- **Bài 1:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 2:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 3:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 4:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 5:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 6:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 7:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 8:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 9:** [Đề bài] | Đáp án: [Đáp án]
- **Bài 10:** [Đề bài] | Đáp án: [Đáp án]

### (4) Bài kiểm tra
Tạo 10 câu hỏi trắc nghiệm liên quan đến chủ đề, mỗi câu có 4 phương án A, B, C, D.
- **Câu 1:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 2:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 3:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 4:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 5:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 6:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 7:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 8:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 9:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]
- **Câu 10:** [Đề bài]
    A. [Phương án A]
    B. [Phương án B]
    C. [Phương án C]
    D. [Phương án D]
    Đáp án: [Đáp án đúng (A, B, C hoặc D)]

### (5) Gợi ý lộ trình tiếp theo
Nhắc học sinh nên học bài nào tiếp (Ví dụ: "Bạn nên học Bài X tiếp theo."). Gợi ý dạng bài còn yếu (nếu có thông tin). Gợi ý sửa lỗi sai (nếu có thông tin).`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        // responseMimeType: "application/json", // Would be ideal, but requires schema which is very complex for this structure. Markdown parsing will be more flexible here.
      }
    });

    const rawText = response.text || '';
    if (!rawText) {
      throw new Error('No content generated by Gemini.');
    }

    return parseGeminiResponse(rawText);

  } catch (error: any) {
    console.error('Error generating lesson content:', error);
    // Provide a more user-friendly error message
    const serviceError: GeminiServiceError = {
      message: 'Không thể tải nội dung bài học. Vui lòng thử lại sau.'
    };
    if (error.status) {
      serviceError.statusCode = error.status;
      if (error.status === 400) {
        serviceError.message = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại cấu trúc lời nhắc.';
      } else if (error.status === 403) {
        serviceError.message = 'Lỗi xác thực API. Vui lòng kiểm tra khóa API của bạn.';
      } else if (error.status === 500) {
        serviceError.message = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
      }
    }
    throw serviceError;
  }
};


export const getQuickReviewQuestions = async (): Promise<QuickReviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Tạo 5 câu hỏi trắc nghiệm ngẫu nhiên về Toán lớp 6 (chương trình Kết nối tri thức). Mỗi câu có 4 phương án A, B, C, D và đáp án đúng. Bao gồm chủ đề của câu hỏi.
  
  Sử dụng định dạng JSON sau:
  \`\`\`json
  [
    {
      "id": "qr_q_1",
      "question": "Câu hỏi 1",
      "options": [
        {"key": "A", "text": "Phương án A"},
        {"key": "B", "text": "Phương án B"},
        {"key": "C", "text": "Phương án C"},
        {"key": "D", "text": "Phương án D"}
      ],
      "correctAnswer": "A",
      "topic": "Số tự nhiên"
    },
    {
      "id": "qr_q_2",
      "question": "Câu hỏi 2",
      "options": [
        {"key": "A", "text": "Phương án A"},
        {"key": "B", "text": "Phương án B"},
        {"key": "C", "text": "Phương án C"},
        {"key": "D", "text": "Phương án D"}
      ],
      "correctAnswer": "B",
      "topic": "Số nguyên"
    },
    {
      "id": "qr_q_3",
      "question": "Câu hỏi 3",
      "options": [
        {"key": "A", "text": "Phương án A"},
        {"key": "B", "text": "Phương án B"},
        {"key": "C", "text": "Phương án C"},
        {"key": "D", "text": "Phương án D"}
      ],
      "correctAnswer": "C",
      "topic": "Phân số"
    },
    {
      "id": "qr_q_4",
      "question": "Câu hỏi 4",
      "options": [
        {"key": "A", "text": "Phương án A"},
        {"key": "B", "text": "Phương án B"},
        {"key": "C", "text": "Phương án C"},
        {"key": "D", "text": "Phương án D"}
      ],
      "correctAnswer": "D",
      "topic": "Hình học"
    },
    {
      "id": "qr_q_5",
      "question": "Câu hỏi 5",
      "options": [
        {"key": "A", "text": "Phương án A"},
        {"key": "B", "text": "Phương án B"},
        {"key": "C", "text": "Phương án C"},
        {"key": "D", "text": "Phương án D"}
      ],
      "correctAnswer": "A",
      "topic": "Thống kê"
    }
  ]
  \`\`\``;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["key", "text"],
                },
              },
              correctAnswer: { type: Type.STRING },
              topic: { type: Type.STRING },
            },
            required: ["id", "question", "options", "correctAnswer", "topic"],
          },
        },
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as QuickReviewQuestion[];

  } catch (error: any) {
    console.error('Error generating quick review questions:', error);
    const serviceError: GeminiServiceError = {
      message: 'Không thể tải câu hỏi ôn tập nhanh. Vui lòng thử lại sau.'
    };
    if (error.status) {
      serviceError.statusCode = error.status;
    }
    throw serviceError;
  }
};


export const getQuizFeedback = async (quizQuestions: QuizQuestion[], userAnswers: { [key: string]: string }, score: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const correctCount = score;
  const incorrectCount = quizQuestions.length - score;

  let feedbackPrompt = `Một học sinh vừa hoàn thành bài kiểm tra với ${quizQuestions.length} câu hỏi. Học sinh đạt ${score}/${quizQuestions.length} điểm.
  
  Dựa trên kết quả này, hãy đưa ra một gợi ý lộ trình học tập tiếp theo. Cụ thể:
  - Nhận xét chung về điểm số.
  - Gợi ý các dạng bài hoặc chủ đề có thể còn yếu, dựa trên các câu hỏi và đáp án nếu có thể suy luận (giả định các câu hỏi thuộc các dạng/chủ đề khác nhau).
  - Khuyến khích và động viên học sinh.
  
  Đây là các câu hỏi và đáp án của học sinh (đáp án đúng được chỉ định):
  `;

  quizQuestions.forEach((q, index) => {
    const userAnswer = userAnswers[q.id] || 'Không trả lời';
    const isCorrect = userAnswer === q.correctAnswer;
    feedbackPrompt += `\nCâu ${index + 1}: "${q.question}"`;
    if (q.options) {
        feedbackPrompt += `\n   Các lựa chọn: ${q.options.map(opt => `${opt.key}. ${opt.text}`).join(', ')}`;
    }
    feedbackPrompt += `\n   Đáp án của học sinh: ${userAnswer}`;
    feedbackPrompt += `\n   Đáp án đúng: ${q.correctAnswer}`;
    feedbackPrompt += `\n   Kết quả: ${isCorrect ? 'Đúng' : 'Sai'}\n`;
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: feedbackPrompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return response.text || 'Không thể tạo gợi ý lộ trình tiếp theo. Vui lòng thử lại.';

  } catch (error: any) {
    console.error('Error generating quiz feedback:', error);
    return 'Lỗi khi tạo gợi ý. Vui lòng thử lại sau.';
  }
};
