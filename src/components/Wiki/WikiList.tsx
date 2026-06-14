// src/components/Wiki/WikiList.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { WikiArticle, WikiCategory, WIKI_CATEGORIES } from '../../types';
import { Book, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import './Wiki.css';

interface WikiListProps {
  onSelectArticle: (article: WikiArticle) => void;
  onBack: () => void;
}

export function WikiList({ onSelectArticle, onBack }: WikiListProps) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<WikiCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const articlesRef = collection(db, 'wiki');
      const q = query(
        articlesRef,
        where('published', '==', true)
      );
      const snapshot = await getDocs(q);
      const loadedArticles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as WikiArticle[];
      // Sort by order field, then by title
      loadedArticles.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      });
      setArticles(loadedArticles);
    } catch (error) {
      console.error('Error loading wiki articles:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter articles by category and search
  const filteredArticles = articles.filter(article => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Group articles by category
  const articlesByCategory = WIKI_CATEGORIES.map(category => ({
    ...category,
    articles: filteredArticles.filter(a => a.category === category.id),
  }));

  if (loading) {
    return (
      <div className="wiki-loading">
        <Book size={32} />
        <p>Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="wiki-list">
      <div className="wiki-header">
        <button onClick={onBack} className="wiki-back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="wiki-title">
          <Book size={28} color="#059669" />
          <h1>Food Forest Wiki</h1>
        </div>
        <p className="wiki-subtitle">
          Learn permaculture principles and food forest design
        </p>
      </div>

      <div className="wiki-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="wiki-categories">
        <button
          className={`wiki-category-btn ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {WIKI_CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`wiki-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="wiki-empty">
          <Book size={48} color="#cbd5e1" />
          <h3>No articles yet</h3>
          <p>Wiki articles will appear here once created by an admin.</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="wiki-empty">
          <Search size={48} color="#cbd5e1" />
          <h3>No matching articles</h3>
          <p>Try a different search term or category.</p>
        </div>
      ) : selectedCategory ? (
        // Show filtered list
        <div className="wiki-article-list">
          {filteredArticles.map(article => (
            <button
              key={article.id}
              className="wiki-article-item"
              onClick={() => onSelectArticle(article)}
            >
              <div className="wiki-article-info">
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                {article.tags && article.tags.length > 0 && (
                  <div className="wiki-article-tags">
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="wiki-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      ) : (
        // Show by category
        <div className="wiki-by-category">
          {articlesByCategory
            .filter(cat => cat.articles.length > 0)
            .map(category => (
              <div key={category.id} className="wiki-category-section">
                <h2>
                  <span>{category.icon}</span>
                  {category.name}
                </h2>
                <p className="wiki-category-desc">{category.description}</p>
                <div className="wiki-article-list">
                  {category.articles.map(article => (
                    <button
                      key={article.id}
                      className="wiki-article-item"
                      onClick={() => onSelectArticle(article)}
                    >
                      <div className="wiki-article-info">
                        <h3>{article.title}</h3>
                        <p>{article.summary}</p>
                      </div>
                      <ChevronRight size={20} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
