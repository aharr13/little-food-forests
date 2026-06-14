// src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, LogOut, User, Book, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import './Dashboard.css';

interface Project {
  id: string;
  name: string;
  address: string;
  createdAt: any;
  updatedAt: any;
}

// Admin emails - users with these emails can access wiki admin
const ADMIN_EMAILS = ['aharr13@gmail.com'];

interface DashboardProps {
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenWiki: () => void;
  onOpenWikiAdmin: () => void;
}

export function Dashboard({ onCreateProject, onOpenProject, onOpenWiki, onOpenWikiAdmin }: DashboardProps) {
  const { currentUser, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  async function loadProjects() {
    if (!currentUser) return;

    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const projectData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <h1>Little Food Forests</h1>
        </div>
        <div className="dashboard-actions">
          <button onClick={onOpenWiki} className="dashboard-action-btn">
            <Book size={18} />
            Wiki
          </button>
          {isAdmin && (
            <button onClick={onOpenWikiAdmin} className="dashboard-action-btn admin-btn">
              <Settings size={18} />
              Wiki Admin
            </button>
          )}
        </div>
        <div className="dashboard-user">
          <div className="user-info">
            <User size={18} />
            <span>{currentUser?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-title">
            <h2>My Food Forests</h2>
            <button onClick={onCreateProject} className="create-project-btn">
              <Plus size={20} />
              Create New Project
            </button>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <p>Loading your projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="dashboard-empty">
              <MapPin size={64} color="#cbd5e1" />
              <h3>No projects yet</h3>
              <p>Start by creating your first food forest design!</p>
              <button onClick={onCreateProject} className="create-first-btn">
                <Plus size={20} />
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <button
                  key={project.id}
                  className="project-card"
                  onClick={() => onOpenProject(project.id)}
                >
                  <div className="project-icon">
                    <MapPin size={24} color="#059669" />
                  </div>
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p className="project-address">{project.address}</p>
                    <div className="project-meta">
                      <Calendar size={14} />
                      <span>Updated {formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}