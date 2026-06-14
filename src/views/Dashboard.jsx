// =========== FILE: src/views/Dashboard.jsx ===========
// This is the new, primary landing page for the application.
// Create this file in `src/views`.

import React from 'react';
import { Settings } from 'lucide-react';

const Dashboard = ({ setCurrentView }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
        <div>
            <h1 className="card-title" style={{border: 'none', padding: 0}}>Tiny Dinosaur Farms Dashboard</h1>
            <p style={{marginTop: '-10px', color: '#666'}}>Your daily view for farm content and operations.</p>
        </div>
        <button 
            onClick={() => setCurrentView('missionControl')}
            style={{ 
                backgroundColor: 'var(--pasture-green)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontWeight: 'bold',
            }}
        >
            <Settings size={20} />
            Go to Mission Control
        </button>
      </div>

      <div>
        <h2 style={{fontFamily: "'Nunito', sans-serif"}}>Farm Overview</h2>
        <p>This is where we'll build the main dashboard content for viewing your farm's status, schedule, chicken info, etc.</p>
        {/* We will add components here for things like "Today's Schedule", "Chicken Roster", etc. */}
      </div>
    </div>
  );
};

export default Dashboard;
