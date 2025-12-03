
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple markdown to HTML conversion (can be extended or replaced with a library)
  const renderMarkdown = (markdown: string) => {
    let html = markdown;

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-3 mt-5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold mb-4 mt-6">$1</h1>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-primary">$1</strong>');
    // Italic text
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

    // Lists (simple unordered list for now)
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    if (html.includes('<li')) {
      html = `<ul>${html}</ul>`;
    }

    // Paragraphs - ensure new lines create paragraphs
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = `<p class="mb-3">${html}</p>`;

    // Replace <p><ul> and </ul></p> issues
    html = html.replace(/<p><ul>/g, '<ul><p>');
    html = html.replace(/<\/ul><\/p>/g, '</p></ul>');
    html = html.replace(/<\/p><li>/g, '</li><li>'); // Fixes p tag within list items

    // Add specific styles for examples/solutions if needed, currently relies on markdown bolding
    html = html.replace(/(Lời giải chi tiết:)/g, '<strong class="text-secondary">$1</strong>');
    html = html.replace(/(Sai lầm thường gặp:)/g, '<strong class="text-red-500">$1</strong>');


    return { __html: html };
  };

  return (
    <div
      className="markdown-content text-base leading-relaxed"
      dangerouslySetInnerHTML={renderMarkdown(content)}
    />
  );
};

export default MarkdownRenderer;
