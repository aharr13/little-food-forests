// src/hooks/useUserProfile.ts
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  goals?: string;
  experience?: string;
  timeAvailable?: string;
  soilType?: string;
  waterSource?: string;
  constraints?: string;
  interests?: string;
  family?: string;
  otherNotes?: string;
}

export function useUserProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid);
    getDoc(ref).then(snap => {
      if (snap.exists() && snap.data().gardenProfile) {
        setProfile(snap.data().gardenProfile as UserProfile);
      }
    }).catch(console.error);
  }, [currentUser?.uid]);

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!currentUser) return;
    const merged: UserProfile = {};
    // Merge: only overwrite a field if the new value is non-empty
    const all = { ...profile, ...updates };
    for (const [k, v] of Object.entries(all)) {
      if (v && v.trim()) (merged as any)[k] = v.trim();
    }
    setProfile(merged);
    const ref = doc(db, 'users', currentUser.uid);
    await setDoc(ref, { gardenProfile: merged }, { merge: true });
  }

  return { profile, updateProfile };
}
