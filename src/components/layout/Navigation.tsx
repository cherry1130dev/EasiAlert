import React from 'react';
import { Home, Users, Sliders, Bluetooth } from 'lucide-react';

export type NavTab = 'home' | 'contacts' | 'hardware' | 'alerts';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'contacts', label: 'Contacts', icon: <Users size={20} /> },
    { id: 'hardware', label: 'Hardware', icon: <Bluetooth size={20} /> },
    { id: 'alerts', label: 'Alerts', icon: <Sliders size={20} /> },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
