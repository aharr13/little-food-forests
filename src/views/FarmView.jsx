// =========== FILE: src/views/MissionControl.jsx ===========
// This is the main project hub.

import React from 'react';
import { Share2, Brain, Feather, Droplets, GitBranch, Video } from 'lucide-react';

const MissionControl = ({ setCurrentView }) => {
  
  // Reusable styles for the boxes in our map
  const boxStyle = {
    border: '2px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: 'var(--surface-white)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  };

  const titleStyle = {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '800',
    fontSize: '1.5rem',
    color: 'var(--pasture-green)',
    margin: '0 0 10px 0',
  };
  
  const subtitleStyle = {
    fontSize: '0.9rem',
    color: '#666',
    margin: '0',
    minHeight: '40px',
  };
  
  const clickableBoxStyle = {
      ...boxStyle,
      cursor: 'pointer',
      transition: 'transform 0.2s',
  };
  
  const primaryFocusStyle = {
    ...clickableBoxStyle,
    borderColor: 'var(--sunny-yellow)',
    boxShadow: '0 0 15px rgba(254, 203, 46, 0.4)',
  };
  
  // Simple hover effect function
  const handleHover = (e, enter) => {
    e.currentTarget.style.transform = enter ? 'scale(1.03)' : 'scale(1)';
  };

  return (
    <div className="card">
      <h1 className="card-title">Mission Control: Eggsistentialnest</h1>
      
      {/* Clickable AI Collab Log section */}
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <div 
            style={clickableBoxStyle} 
            onClick={() => setCurrentView('aiCollaborationLog')}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
        >
          <Brain size={24} style={{ color: 'var(--texas-blue)' }}/>
          <h2 style={titleStyle}>AI Collaboration Log</h2>
          <p style={subtitleStyle}>Our shared project history, blueprint, and session notes.</p>
        </div>
      </div>
      
      {/* "Tiny Dinosaur Farms" container */}
      <div style={{...boxStyle, backgroundColor: 'transparent', boxShadow: 'none', border: 'none', marginTop: '30px' }}>
        <Share2 size={32} style={{ color: 'var(--pasture-green)', marginBottom: '10px' }} />
        <h2 style={{...titleStyle, fontSize: '1.8rem'}}>Tiny Dinosaur Farms</h2>
        <p style={subtitleStyle}>The public-facing brand for the ethically-raised Serama chicken farm and its products.</p>
      </div>
        
      {/* Grid of sub-projects */}
      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '20px'
      }}>
        <div 
            style={primaryFocusStyle}
            onClick={() => setCurrentView('farmPlanner')}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
        >
            <Droplets size={24} style={{ color: 'var(--carnelian)' }}/>
            <h2 style={titleStyle}>AI Farm Planner <span style={{fontSize: '0.8rem', color: 'var(--carnelian)'}}>(Primary Focus)</span></h2>
            <p style={subtitleStyle}>Public-facing tool for creating food forests. The grant-eligible portion of the project.</p>
        </div>
        <div style={boxStyle}>
            <GitBranch size={24} style={{ color: 'var(--texas-blue)' }}/>
            <h2 style={titleStyle}>Chicken Genetics Map</h2>
            <p style={subtitleStyle}>Tracking the lineage and traits of the Serama flock. (Future Milestone)</p>
        </div>
         <div style={boxStyle}>
            <Feather size={24} style={{ color: 'var(--texas-blue)' }}/>
            <h2 style={titleStyle}>Chicken Training Logs</h2>
            <p style={subtitleStyle}>Documenting insights on sentience from training chickens. (Future Milestone)</p>
        </div>
        <div style={boxStyle}>
            <Video size={24} style={{ color: 'var(--texas-blue)' }}/>
            <h2 style={titleStyle}>Creative & Engagement Assets</h2>
            <p style={subtitleStyle}>"Croc Fighting" videos, "Cluckzilla" parodies, etc. (Future Milestone)</p>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;


// =========== FILE: src/views/AICollabLogViewer.jsx ===========
// Create this new file in `src/views`.

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain } from 'lucide-react';

const AICollabLogViewer = () => {
    const [markdown, setMarkdown] = useState('');
    
    useEffect(() => {
        // This fetches the content of your local markdown file.
        // Make sure you have the file at `src/AICollabLog.md`.
        fetch('/src/AICollabLog.md')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => setMarkdown(text))
            .catch(err => {
                console.error('Error fetching markdown:', err);
                setMarkdown('# Error\n\nCould not load `AICollabLog.md`. Please make sure the file exists at `/src/AICollabLog.md`.');
            });
    }, []);

    // Add a basic .prose style to your App.css if you haven't already
    // to style the markdown output nicely.
    return (
        <div className="card">
            <h1 className="card-title" style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Brain /> AI Collaboration Log & Project Blueprint</h1>
            <div className="prose">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
        </div>
    );
};

export default AICollabLogViewer;


// =========== FILE: src/App.jsx ===========
// Replace your entire App.jsx with this.

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Component Imports
import MissionControl from './views/MissionControl.jsx';
import FarmPlanner from './views/FarmPlanner.jsx';
import AICollabLogViewer from './views/AICollabLogViewer.jsx';

// Style Import
import './App.css';

// --- Firebase Configuration Placeholder ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed. Are your config keys valid?", error);
}

export default function App() {
  const [currentView, setCurrentView] = useState('missionControl'); // Default to our new hub
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { setUserId(user.uid); }
      else { signInAnonymously(auth).catch(err => console.error("Sign-in failed:", err)); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderView = () => {
    if (loading) return <p>Loading...</p>;
    
    // Simple button to always return to Mission Control
    const backButton = (
        <button 
            onClick={() => setCurrentView('missionControl')}
            style={{ marginBottom: '20px', backgroundColor: 'var(--pasture-green)', color: 'white' }}
        >
            ← Back to Mission Control
        </button>
    );

    switch (currentView) {
      case 'missionControl':
        return <MissionControl setCurrentView={setCurrentView} />;
      case 'farmPlanner':
        return <div>{backButton}<FarmPlanner /></div>;
      case 'aiCollaborationLog':
        return <div>{backButton}<AICollabLogViewer /></div>;
      default:
        return <div>{backButton}<h1>{currentView}</h1><p>Under Construction.</p></div>;
    }
  };

  return (
    <div className="app-container">
      {/* We've removed the sidebar to focus navigation through Mission Control */}
      <main className="main-content" style={{width: '100%', maxWidth: '1200px', margin: '0 auto'}}>
        {renderView()}
      </main>
    </div>
  );
}
