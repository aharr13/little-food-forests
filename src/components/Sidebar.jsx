import React from 'react';
import { 
  Map as MapIcon, 
  Sprout, 
  Database, 
  Calendar, 
  BookOpen,
  LayoutDashboard,
  Settings
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  // These menu items reflect the 4-Step Food Forest Roadmap
  const menuItems = [
    { id: 'dashboard', label: 'My Project Hub', icon: LayoutDashboard },
    { id: 'map', label: 'Step 1: Map & Layer', icon: MapIcon },
    { id: 'soil', label: 'Step 2: Soil Prep', icon: Database },
    { id: 'select', label: 'Step 3: Plant Selection', icon: Sprout },
    { id: 'schedule', label: 'Step 4: Planting Schedule', icon: Calendar },
    { id: 'wiki', label: 'Knowledge Base', icon: BookOpen },
  ];

  const sidebarStyle = {
    width: '260px',
    backgroundColor: '#1a2e1a', // Darker forest green
    color: 'white',
    height: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    marginBottom: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#2d4d2d' : 'transparent',
    transition: 'all 0.2s ease',
    color: isActive ? '#fff' : '#a0aec0',
    fontWeight: isActive ? '600' : '400',
  });

  return (
    <div style={sidebarStyle}>
      <div style={{ marginBottom: '32px', paddingLeft: '16px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
          Little Food Forests
        </h1>
        <p style={{ fontSize: '0.75rem', color: '#81c784' }}>Project Manager</p>
      </div>

      <nav style={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={navItemStyle(activeTab === item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #2d4d2d', paddingTop: '20px' }}>
        <div style={navItemStyle(activeTab === 'settings')}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;