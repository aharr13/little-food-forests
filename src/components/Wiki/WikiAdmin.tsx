// src/components/Wiki/WikiAdmin.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { WikiArticle, WikiCategory, WIKI_CATEGORIES } from '../../types';
import {
  Book, Plus, Edit2, Trash2, Eye, EyeOff, Save, X,
  ArrowLeft, ChevronDown, ChevronUp
} from 'lucide-react';
import './Wiki.css';

interface WikiAdminProps {
  onBack: () => void;
}

export function WikiAdmin({ onBack }: WikiAdminProps) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Partial<WikiArticle> | null>(null);
  const [isNewArticle, setIsNewArticle] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(WIKI_CATEGORIES.map(c => c.id)));

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const articlesRef = collection(db, 'wiki');
      const q = query(articlesRef, orderBy('category'), orderBy('title'));
      const snapshot = await getDocs(q);
      const loadedArticles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as WikiArticle[];
      setArticles(loadedArticles);
    } catch (error) {
      console.error('Error loading wiki articles:', error);
    } finally {
      setLoading(false);
    }
  }

  function startNewArticle() {
    setEditingArticle({
      title: '',
      slug: '',
      category: 'getting-started',
      summary: '',
      content: '',
      tags: [],
      published: false,
    });
    setIsNewArticle(true);
  }

  function startEditArticle(article: WikiArticle) {
    setEditingArticle({ ...article });
    setIsNewArticle(false);
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function saveArticle() {
    if (!editingArticle) return;
    if (!editingArticle.title || !editingArticle.content) {
      alert('Please fill in the title and content.');
      return;
    }

    try {
      const articleData = {
        ...editingArticle,
        slug: editingArticle.slug || generateSlug(editingArticle.title),
        updatedAt: new Date(),
      };

      if (isNewArticle) {
        // Create new article
        await addDoc(collection(db, 'wiki'), {
          ...articleData,
          createdAt: new Date(),
        });
      } else if (editingArticle.id) {
        // Update existing article
        const { id, ...updateData } = articleData;
        await updateDoc(doc(db, 'wiki', id as string), updateData);
      }

      setEditingArticle(null);
      setIsNewArticle(false);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article. Please try again.');
    }
  }

  async function deleteArticle(article: WikiArticle) {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'wiki', article.id));
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article.');
    }
  }

  async function togglePublished(article: WikiArticle) {
    try {
      await updateDoc(doc(db, 'wiki', article.id), {
        published: !article.published,
        updatedAt: new Date(),
      });
      loadArticles();
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  }

  function toggleCategory(categoryId: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }

  // Group articles by category
  const articlesByCategory = WIKI_CATEGORIES.map(category => ({
    ...category,
    articles: articles.filter(a => a.category === category.id),
  }));

  if (loading) {
    return (
      <div className="wiki-loading">
        <Book size={32} />
        <p>Loading articles...</p>
      </div>
    );
  }

  // Edit/Create form
  if (editingArticle) {
    return (
      <div className="wiki-admin">
        <div className="wiki-admin-header">
          <h1>{isNewArticle ? 'Create New Article' : 'Edit Article'}</h1>
        </div>

        <div className="wiki-edit-form">
          <div className="wiki-form-row">
            <label>Title *</label>
            <input
              type="text"
              value={editingArticle.title || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                title: e.target.value,
                slug: generateSlug(e.target.value),
              })}
              placeholder="Article title"
            />
          </div>

          <div className="wiki-form-row">
            <label>URL Slug</label>
            <input
              type="text"
              value={editingArticle.slug || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                slug: e.target.value,
              })}
              placeholder="url-friendly-slug"
            />
          </div>

          <div className="wiki-form-row">
            <label>Category *</label>
            <select
              value={editingArticle.category || 'getting-started'}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                category: e.target.value as WikiCategory,
              })}
            >
              {WIKI_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wiki-form-row">
            <label>Summary *</label>
            <textarea
              value={editingArticle.summary || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                summary: e.target.value,
              })}
              placeholder="Brief description shown in article lists"
              rows={2}
            />
          </div>

          <div className="wiki-form-row">
            <label>Content * (Markdown supported)</label>
            <textarea
              value={editingArticle.content || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                content: e.target.value,
              })}
              placeholder="Article content in Markdown format..."
              rows={15}
              className="wiki-content-editor"
            />
          </div>

          <div className="wiki-form-row">
            <label>Hero Image URL</label>
            <input
              type="text"
              value={editingArticle.imageUrl || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                imageUrl: e.target.value,
              })}
              placeholder="https://storage.googleapis.com/..."
            />
          </div>

          <div className="wiki-form-row">
            <label>Learning Activity Title</label>
            <input
              type="text"
              value={editingArticle.learningActivity?.title || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                learningActivity: {
                  title: e.target.value,
                  steps: editingArticle.learningActivity?.steps || [],
                },
              })}
              placeholder="The Slake Test"
            />
          </div>

          <div className="wiki-form-row">
            <label>Learning Activity Steps (one per line)</label>
            <textarea
              value={editingArticle.learningActivity?.steps?.join('\n') || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                learningActivity: {
                  title: editingArticle.learningActivity?.title || '',
                  steps: e.target.value.split('\n').filter(s => s.trim()),
                },
              })}
              placeholder="Step 1: Gather materials...&#10;Step 2: Observe...&#10;Step 3: Record results..."
              rows={5}
            />
          </div>

          <div className="wiki-form-row">
            <label>Reflective Question</label>
            <textarea
              value={editingArticle.reflectiveQuestion || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                reflectiveQuestion: e.target.value,
              })}
              placeholder="A thought-provoking question for readers..."
              rows={2}
            />
          </div>

          <div className="wiki-form-row">
            <label>Display Order</label>
            <input
              type="number"
              value={editingArticle.order || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                order: e.target.value ? parseInt(e.target.value) : undefined,
              })}
              placeholder="1"
              min={1}
            />
          </div>

          <div className="wiki-form-row">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={editingArticle.tags?.join(', ') || ''}
              onChange={(e) => setEditingArticle({
                ...editingArticle,
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t),
              })}
              placeholder="permaculture, beginner, nitrogen-fixing"
            />
          </div>

          <div className="wiki-form-row wiki-form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={editingArticle.published || false}
                onChange={(e) => setEditingArticle({
                  ...editingArticle,
                  published: e.target.checked,
                })}
              />
              Published (visible to users)
            </label>
          </div>

          <div className="wiki-form-actions">
            <button
              className="wiki-btn wiki-btn-secondary"
              onClick={() => {
                setEditingArticle(null);
                setIsNewArticle(false);
              }}
            >
              <X size={18} />
              Cancel
            </button>
            <button
              className="wiki-btn wiki-btn-primary"
              onClick={saveArticle}
            >
              <Save size={18} />
              Save Article
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Article list
  return (
    <div className="wiki-admin">
      <div className="wiki-admin-header">
        <button onClick={onBack} className="wiki-back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>
          <Book size={24} />
          Wiki Admin
        </h1>
        <button className="wiki-btn wiki-btn-primary" onClick={startNewArticle}>
          <Plus size={18} />
          New Article
        </button>
      </div>

      <div className="wiki-admin-stats">
        <span>{articles.length} total articles</span>
        <span>{articles.filter(a => a.published).length} published</span>
        <span>{articles.filter(a => !a.published).length} drafts</span>
      </div>

      {articles.length === 0 ? (
        <div className="wiki-empty">
          <Book size={48} color="#cbd5e1" />
          <h3>No articles yet</h3>
          <p>Click "New Article" to create your first wiki article.</p>
        </div>
      ) : (
        <div className="wiki-admin-categories">
          {articlesByCategory.map(category => (
            <div key={category.id} className="wiki-admin-category">
              <button
                className="wiki-admin-category-header"
                onClick={() => toggleCategory(category.id)}
              >
                <span className="wiki-admin-category-title">
                  <span>{category.icon}</span>
                  {category.name}
                  <span className="wiki-admin-category-count">
                    ({category.articles.length})
                  </span>
                </span>
                {expandedCategories.has(category.id) ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {expandedCategories.has(category.id) && category.articles.length > 0 && (
                <div className="wiki-admin-articles">
                  {category.articles.map(article => (
                    <div key={article.id} className="wiki-admin-article">
                      <div className="wiki-admin-article-info">
                        <h3>
                          {article.title}
                          {!article.published && (
                            <span className="wiki-draft-badge">Draft</span>
                          )}
                        </h3>
                        <p>{article.summary}</p>
                      </div>
                      <div className="wiki-admin-article-actions">
                        <button
                          onClick={() => togglePublished(article)}
                          title={article.published ? 'Unpublish' : 'Publish'}
                        >
                          {article.published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => startEditArticle(article)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteArticle(article)}
                          title="Delete"
                          className="wiki-delete-btn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expandedCategories.has(category.id) && category.articles.length === 0 && (
                <div className="wiki-admin-empty-category">
                  No articles in this category
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
