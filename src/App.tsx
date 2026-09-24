import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import type { NavTab } from './components/layout/Navigation';
import { HomeScreen } from './components/home/HomeScreen';
import { ContactsScreen } from './components/contacts/ContactsScreen';
import { HardwareScreen } from './components/hardware/HardwareScreen';
import { AlertsScreen } from './components/alerts/AlertsScreen';
import { CountdownOverlay } from './components/emergency/CountdownOverlay';
import { PermissionGuardModal } from './components/common/PermissionGuardModal';

const TAB_ORDER: NavTab[] = ['home', 'contacts', 'hardware', 'alerts'];

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const touchLastPos = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    // Don't intercept swipe if user is interacting with form controls or sliders
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea, [data-no-swipe]'))) {
      touchStartPos.current = null;
      touchLastPos.current = null;
      return;
    }

    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      touchLastPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchLastPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartPos.current;
    if (!start) return;

    const endX =
      e.changedTouches && e.changedTouches.length > 0
        ? e.changedTouches[0].clientX
        : touchLastPos.current
        ? touchLastPos.current.x
        : start.x;
    const endY =
      e.changedTouches && e.changedTouches.length > 0
        ? e.changedTouches[0].clientY
        : touchLastPos.current
        ? touchLastPos.current.y
        : start.y;

    const deltaX = endX - start.x;
    const deltaY = endY - start.y;
    touchStartPos.current = null;
    touchLastPos.current = null;

    // Must be predominantly horizontal gesture with minimum threshold of 60px and clear horizontal dominance
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.6 && Math.abs(deltaX) >= 60) {
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      if (deltaX < 0) {
        // Swiped Left -> Move to Next Tab
        if (currentIndex < TAB_ORDER.length - 1) {
          setCurrentTab(TAB_ORDER[currentIndex + 1]);
        }
      } else {
        // Swiped Right -> Move to Previous Tab
        if (currentIndex > 0) {
          setCurrentTab(TAB_ORDER[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <div className="app-viewport">
      {/* Header Bar */}
      <Header />

      {/* Main Screen Content with swipe gestures */}
      <main
        className="app-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* 4 Primary Navigation Screens */}
        {currentTab === 'home' && <HomeScreen onNavigate={setCurrentTab} />}
        {currentTab === 'contacts' && <ContactsScreen />}
        {currentTab === 'hardware' && <HardwareScreen />}
        {currentTab === 'alerts' && <AlertsScreen />}
      </main>

      {/* Full-screen Countdown Overlay */}
      <CountdownOverlay />

      {/* Mandatory Permissions Check on App Launch */}
      <PermissionGuardModal />

      {/* Bottom Navigation */}
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
