import React from 'react';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, isSidebarOpen, setIsSidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  ];

  return (
    <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Car className="sidebar-logo text-primary" size={24} />
          <span className="sidebar-title">TMT Car Rental</span>
        </div>
        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" style={{ marginBottom: '0.5rem' }}>
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Fleet Admin</span>
            <span className="user-role">Dubai Branch</span>
          </div>
        </div>
        <button
          onClick={() => {
            onLogout();
            setIsSidebarOpen(false);
          }}
          className="sidebar-item"
          style={{
            width: '100%',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.05)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            marginTop: '0.5rem'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
