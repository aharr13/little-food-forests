// src/hooks/usePlantingTasks.ts
import { useState, useEffect } from 'react';
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { PlantingTask, TaskStep } from '../types';

export function usePlantingTasks(projectId: string | null, userId: string | null = null) {
  const [tasks, setTasks] = useState<PlantingTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !userId) { setTasks([]); return; }
    setLoading(true);
    // Query by userId (single-field index, no composite index needed).
    // Filter by projectId in memory so security rules can enforce ownership
    // via resource.data.userId == request.auth.uid.
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
    );
    getDocs(q).then(snap => {
      const loaded: PlantingTask[] = snap.docs
        .filter(d => d.data().projectId === projectId)
        .map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
            completedAt: data.completedAt?.toDate?.() ?? undefined,
            // scheduledDate may be a Firestore Timestamp or an ISO string
            scheduledDate: data.scheduledDate?.toDate?.() ?? (data.scheduledDate ? new Date(data.scheduledDate) : undefined),
            steps: (data.steps ?? []).map((s: any) => ({
              ...s,
              completedAt: s.completedAt?.toDate?.() ?? undefined,
            })),
          } as PlantingTask;
        });
      setTasks(loaded.sort((a, b) => a.establishmentOrder - b.establishmentOrder));
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId, userId]);

  async function upsertTask(task: PlantingTask) {
    // Update state immediately so the UI doesn't wait for Firestore
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      const updated = exists
        ? prev.map(t => (t.id === task.id ? task : t))
        : [...prev, task].sort((a, b) => a.establishmentOrder - b.establishmentOrder);
      return updated;
    });
    const ref = doc(db, 'tasks', task.id);
    // Firestore rejects undefined values — replace with null
    const data = JSON.parse(JSON.stringify({ ...task, updatedAt: new Date() }, (_, v) =>
      v === undefined ? null : v
    ));
    await setDoc(ref, data, { merge: true });
  }

  async function completeStep(taskId: string, stepId: string): Promise<PlantingTask | null> {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const now = new Date();
    const newSteps: TaskStep[] = task.steps.map(s =>
      s.id === stepId ? { ...s, completed: true, completedAt: now } : s,
    );

    const completedCount = newSteps.filter(s => s.completed).length;
    const totalXp = task.xpReward;
    const xpEarned = Math.round((completedCount / newSteps.length) * totalXp);
    const allDone = completedCount === newSteps.length;

    const updated: PlantingTask = {
      ...task,
      steps: newSteps,
      xpEarned,
      status: allDone ? 'completed' : completedCount > 0 ? 'in_progress' : 'pending',
      completedAt: allDone ? now : undefined,
      updatedAt: now,
    };

    await upsertTask(updated);
    return updated;
  }

  async function uncompleteStep(taskId: string, stepId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSteps: TaskStep[] = task.steps.map(s =>
      s.id === stepId ? { ...s, completed: false, completedAt: undefined } : s,
    );
    const completedCount = newSteps.filter(s => s.completed).length;
    const xpEarned = Math.round((completedCount / newSteps.length) * task.xpReward);

    const updated: PlantingTask = {
      ...task,
      steps: newSteps,
      xpEarned,
      status: completedCount === 0 ? 'pending' : 'in_progress',
      completedAt: undefined,
      updatedAt: new Date(),
    };

    await upsertTask(updated);
  }

  async function deleteTask(taskId: string) {
    await deleteDoc(doc(db, 'tasks', taskId));
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  async function deleteTasksForShape(shapeId: string) {
    const toDelete = tasks.filter(t => t.shapeId === shapeId);
    await Promise.all(toDelete.map(t => deleteDoc(doc(db, 'tasks', t.id))));
    setTasks(prev => prev.filter(t => t.shapeId !== shapeId));
  }

  return { tasks, loading, upsertTask, completeStep, uncompleteStep, deleteTask, deleteTasksForShape };
}
