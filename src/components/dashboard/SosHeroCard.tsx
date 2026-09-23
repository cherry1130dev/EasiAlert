import React from 'react';
import { Radio, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveAlertCard } from './ActiveAlertCard';

export const SosHeroCard: React.FC = () => {
  const { isArmed, toggleArmed, triggerEmergency, themeConfig } = useApp();

  const handleSosPress = () => {
    if (!isArmed) {
      if (window.confirm('The system is currently DISARMED. Would you like to ARM it and trigger the emergency test?')) {
        toggleArmed();
        triggerEmergency('MANUAL_APP', 'Dashboard SOS Test Button');
      }
      return;
    }
    triggerEmergency('MANUAL_APP', 'Dashboard SOS Test Button');
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Active Alert Session Monitor */}
      <ActiveAlertCard />

      {/* Hero SOS Trigger & Master Arm Card */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(18, 25, 44, 0.7) 100%)',
          border: `1px solid var(--theme-border, rgba(239, 68, 68, 0.3))`,
          boxShadow: `0 8px 32px var(--theme-glow, rgba(239, 68, 68, 0.15))`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Theme pill indicator */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'var(--theme-badge-bg, rgba(239, 68, 68, 0.15))',
            color: 'var(--theme-badge-color, #f87171)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Zap size={11} /> {themeConfig.name}
        </div>

        {/* SOS Panic Trigger Button */}
        <div style={{ margin: '14px 0 10px 0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSosPress}
            className={`sos-button ${!isArmed ? 'disarmed' : ''}`}
            aria-label="Trigger Emergency SOS Test"
            style={{
              background: isArmed ? 'var(--theme-gradient)' : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
              boxShadow: isArmed ? `0 0 28px var(--theme-glow)` : 'none',
              width: 140,
              height: 140,
            }}
          >
            <Radio size={30} style={{ marginBottom: 4 }} />
            <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.05em' }}>
              {isArmed ? 'SOS' : 'OFF'}
            </span>
            <span style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 700, marginTop: 2 }}>
              {isArmed ? 'TEST SOS' : 'TAP TO ARM'}
            </span>
          </button>
        </div>

        {/* Master Armed Status Bar */}
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 340,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isArmed ? (
              <ShieldAlert size={18} color="#10b981" />
            ) : (
              <ShieldCheck size={18} color="#64748b" />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                System {isArmed ? 'Armed & Listening' : 'Disarmed'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {isArmed ? 'Bluetooth signals & button will fire SMS' : 'Hardware signals muted'}
              </div>
            </div>
          </div>

          <label className="switch" style={{ transform: 'scale(0.8)' }}>
            <input type="checkbox" checked={isArmed} onChange={toggleArmed} />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};
