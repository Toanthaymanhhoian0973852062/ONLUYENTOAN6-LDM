
import React from 'react';
import { ChapterOutline, ChapterStatus, LessonOutline } from '../types';

interface SidebarProps {
  curriculum: ChapterOutline[];
  onLessonSelect: (chapterId: string, lessonId: string) => void;
  selectedLessonId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ curriculum, onLessonSelect, selectedLessonId }) => {
  const getChapterStatusColor = (status: ChapterStatus) => {
    switch (status) {
      case ChapterStatus.NOT_STARTED:
        return 'bg-chapter-not-started';
      case ChapterStatus.IN_PROGRESS:
        return 'bg-chapter-in-progress';
      case ChapterStatus.COMPLETED:
        return 'bg-chapter-completed';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-bg-light shadow-lg p-4 overflow-y-auto z-10">
      <h2 className="text-xl font-bold text-text-dark mb-4">Mục lục</h2>
      <nav>
        {curriculum.map((chapter) => (
          <div key={chapter.id} className="mb-4">
            <div className="flex items-center mb-2">
              <span className={`w-3 h-3 rounded-full mr-2 ${getChapterStatusColor(chapter.status)}`}></span>
              <h3 className="font-semibold text-lg text-text-dark">{chapter.title}</h3>
            </div>
            <ul>
              {chapter.lessons.map((lesson) => (
                <li key={lesson.id} className="mb-1">
                  <button
                    onClick={() => onLessonSelect(chapter.id, lesson.id)}
                    className={`block w-full text-left p-2 rounded-md transition-colors duration-200
                      ${selectedLessonId === lesson.id ? 'bg-primary text-white' : 'hover:bg-gray-200'}
                      ${lesson.isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={lesson.isLocked}
                  >
                    <span className="text-sm font-medium">{lesson.title}</span>
                    <div className="w-full bg-progress-bg rounded-full h-1 mt-1">
                      <div
                        className="bg-progress-fill h-1 rounded-full"
                        style={{ width: `${lesson.progress}%` }}
                      ></div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
