// =========== FILE: src/views/MissionControl.jsx ===========
// Corrected: Updated "Eggsistentialnest" to "Eggsistential Nest" in the title.

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
      <h1 className="card-title">Mission Control: Eggsistential Nest</h1>
      
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
