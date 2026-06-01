import React, { useState, useEffect } from 'react';
import { db } from './db/mockDb';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Customers from './components/Customers';
import Bookings from './components/Bookings';
import { Sun, Moon, Menu } from 'lucide-react';

const TAB_TITLES = {
  dashboard: 'Dashboard',
  vehicles: 'Vehicle Management',
  customers: 'Customer Management',
  bookings: 'Booking Management',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbData, setDbData] = useState(db.getData());
  const [theme, setTheme] = useState(() => localStorage.getItem('car_rental_theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync with DB custom events
  useEffect(() => {
    const handleDbUpdate = (e) => setDbData(e.detail);
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('car_rental_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const refreshDb = () => setDbData(db.getData());

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard dbData={dbData} setActiveTab={setActiveTab} />;
      case 'vehicles':
        return <Vehicles dbData={dbData} refreshDb={refreshDb} />;
      case 'customers':
        return <Customers dbData={dbData} refreshDb={refreshDb} />;
      case 'bookings':
        return <Bookings dbData={dbData} refreshDb={refreshDb} />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="app-container">
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 999
          }}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setActiveTab('dashboard')}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            <button className="mobile-toggle" onClick={() => setIsSidebarOpen(true)} title="Open Navigation">
              <Menu size={20} />
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className="page-title">{TAB_TITLES[activeTab]}</h1>
              <p className="header-subtitle">
                DXB Luxury Car Rental — Dubai • <span style={{ color: 'var(--success)' }}>Online</span>
              </p>
            </div>
          </div>

          <div className="header-actions" style={{ gap: '0.5rem' }}>
            <button className="theme-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <div className="page-body">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
