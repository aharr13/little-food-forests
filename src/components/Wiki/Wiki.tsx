// src/components/Wiki/Wiki.tsx
import React, { useState } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { WikiArticle } from '../../types';
import { WikiList } from './WikiList';
import { WikiArticleView } from './WikiArticleView';
import './Wiki.css';

interface WikiProps {
  onBack: () => void;
}

export function Wiki({ onBack }: WikiProps) {
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);

  async function handleSelectRelated(articleId: string) {
    try {
      const docRef = doc(db, 'wiki', articleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSelectedArticle({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as WikiArticle);
      }
    } catch (error) {
      console.error('Error loading related article:', error);
    }
  }

  if (selectedArticle) {
    return (
      <WikiArticleView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        onSelectRelated={handleSelectRelated}
      />
    );
  }

  return (
    <WikiList
      onSelectArticle={setSelectedArticle}
      onBack={onBack}
    />
  );
}
