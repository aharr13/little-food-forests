// src/hooks/useWikiArticles.ts
// Fetches all published wiki articles from Firestore once and caches them.
// Used to inject the knowledge base into Claude's system prompt.

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface WikiArticleSlim {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  order: number;
}

export function useWikiArticles() {
  const [articles, setArticles] = useState<WikiArticleSlim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const q = query(
        collection(db, 'wiki'),
        where('published', '==', true),
        orderBy('order', 'asc')
      );
      const snap = await getDocs(q);
      const loaded = snap.docs.map(d => ({
        id: d.id,
        title: d.data().title || '',
        slug: d.data().slug || '',
        category: d.data().category || '',
        summary: d.data().summary || '',
        content: d.data().content || '',
        tags: d.data().tags || [],
        order: d.data().order || 0,
      }));
      setArticles(loaded);
    } catch (err) {
      console.error('Failed to load wiki articles for Claude context:', err);
    } finally {
      setLoading(false);
    }
  }

  return { articles, loading };
}
