// src/components/Wiki/WikiArticleView.tsx
import React from 'react';
import { WikiArticle, WIKI_CATEGORIES } from '../../types';
import { ArrowLeft, Calendar, Tag, Lightbulb, HelpCircle } from 'lucide-react';
import './Wiki.css';

interface WikiArticleViewProps {
  article: WikiArticle;
  onBack: () => void;
  onSelectRelated?: (articleId: string) => void;
}

export function WikiArticleView({ article, onBack, onSelectRelated }: WikiArticleViewProps) {
  const category = WIKI_CATEGORIES.find(c => c.id === article.category);

  // Simple markdown-to-HTML converter for basic formatting
  function renderContent(markdown: string): string {
    let html = markdown
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="wiki-content-image" />')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Unordered lists
      .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
      // Ordered lists
      .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap list items in ul
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    return `<p>${html}</p>`;
  }

  return (
    <div className="wiki-article-view">
      <div className="wiki-article-header">
        <button onClick={onBack} className="wiki-back-btn">
          <ArrowLeft size={18} />
          Back to Wiki
        </button>

        {category && (
          <div className="wiki-article-category">
            <span>{category.icon}</span>
            {category.name}
          </div>
        )}

        <h1>{article.title}</h1>

        <div className="wiki-article-meta">
          {article.updatedAt && (
            <span className="wiki-meta-item">
              <Calendar size={14} />
              Updated {article.updatedAt.toLocaleDateString()}
            </span>
          )}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="wiki-article-tags">
            <Tag size={14} />
            {article.tags.map(tag => (
              <span key={tag} className="wiki-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Hero Image */}
      {article.imageUrl && (
        <div className="wiki-article-hero">
          <img src={article.imageUrl} alt={article.title} />
        </div>
      )}

      <div className="wiki-article-summary">
        {article.summary}
      </div>

      <div
        className="wiki-article-content"
        dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
      />

      {/* Learning Activity */}
      {article.learningActivity && (
        <div className="wiki-learning-activity">
          <div className="wiki-learning-header">
            <Lightbulb size={20} />
            <h3>Try It: {article.learningActivity.title}</h3>
          </div>
          <ol className="wiki-learning-steps">
            {article.learningActivity.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Reflective Question */}
      {article.reflectiveQuestion && (
        <div className="wiki-reflective-question">
          <div className="wiki-reflective-header">
            <HelpCircle size={20} />
            <h3>Think About It</h3>
          </div>
          <p>{article.reflectiveQuestion}</p>
        </div>
      )}

      {article.relatedArticles && article.relatedArticles.length > 0 && onSelectRelated && (
        <div className="wiki-related">
          <h3>Related Articles</h3>
          <div className="wiki-related-list">
            {article.relatedArticles.map(relatedId => (
              <button
                key={relatedId}
                className="wiki-related-item"
                onClick={() => onSelectRelated(relatedId)}
              >
                {relatedId}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
