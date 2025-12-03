
import { ChapterOutline, ChapterStatus } from './types';

export const APP_NAME = 'Toán 6 - Kết nối tri thức';

export const CURRICULUM_OUTLINE: ChapterOutline[] = [
  {
    id: 'chapter1',
    title: 'Chương I: Số tự nhiên',
    status: ChapterStatus.NOT_STARTED,
    lessons: [
      { id: 'c1l1', title: 'Bài 1: Tập hợp và các phần tử', progress: 0, isLocked: false },
      { id: 'c1l2', title: 'Bài 2: Các phép tính với số tự nhiên', progress: 0, isLocked: true },
      { id: 'c1l3', title: 'Bài 3: Lũy thừa với số mũ tự nhiên', progress: 0, isLocked: true },
      { id: 'c1l4', title: 'Bài 4: Tính chất chia hết của một tổng', progress: 0, isLocked: true },
      { id: 'c1l5', title: 'Bài 5: Số nguyên tố và hợp số', progress: 0, isLocked: true },
      { id: 'c1l6', title: 'Bài 6: Phân tích một số ra thừa số nguyên tố', progress: 0, isLocked: true },
      { id: 'c1l7', title: 'Bài 7: Ước chung và bội chung', progress: 0, isLocked: true },
    ],
  },
  {
    id: 'chapter2',
    title: 'Chương II: Số nguyên',
    status: ChapterStatus.NOT_STARTED,
    lessons: [
      { id: 'c2l1', title: 'Bài 8: Tập hợp số nguyên', progress: 0, isLocked: true },
      { id: 'c2l2', title: 'Bài 9: Cộng, trừ số nguyên', progress: 0, isLocked: true },
      { id: 'c2l3', title: 'Bài 10: Quy tắc dấu ngoặc', progress: 0, isLocked: true },
    ],
  },
  {
    id: 'chapter3',
    title: 'Chương III: Phân số',
    status: ChapterStatus.NOT_STARTED,
    lessons: [
      { id: 'c3l1', title: 'Bài 11: Mở rộng khái niệm phân số', progress: 0, isLocked: true },
      { id: 'c3l2', title: 'Bài 12: Phân số bằng nhau', progress: 0, isLocked: true },
      { id: 'c3l3', title: 'Bài 13: Rút gọn phân số', progress: 0, isLocked: true },
    ],
  },
  {
    id: 'chapter4',
    title: 'Chương IV: Số thập phân',
    status: ChapterStatus.NOT_STARTED,
    lessons: [
      { id: 'c4l1', title: 'Bài 14: Số thập phân dương', progress: 0, isLocked: true },
      { id: 'c4l2', title: 'Bài 15: So sánh các số thập phân', progress: 0, isLocked: true },
    ],
  },
  // Add more chapters and lessons as needed based on the curriculum
];

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const LOCAL_STORAGE_KEY_PROGRESS = 'math6_kntt_user_progress';
export const LOCAL_STORAGE_KEY_CURRICULUM = 'math6_kntt_curriculum_outline';

export const QUIZ_PASS_SCORE = 7;
