import React, { useState } from 'react';
import { Radio, ShieldAlert, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveAlertCard } from './ActiveAlertCard';

export const SosHeroCard: React.FC = () => {
  const { isArmed, toggleArmed, triggerEmergency, themeConfig } = useApp();
  const [showDisarmedModal, setShowDisarmedModal] = useState(false);

  const handleSosPress = () => {
    if (!isArmed) {
      setShowDisarmedModal(true);
      return;
    }
    triggerEmergency('MANUAL_APP', 'Dashboard SOS Test Button');
  };

  const handleArmAndTrigger = () => {
    setShowDisarmedModal(false);
    toggleArmed();
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

      {/* Disarmed Confirmation Modal */}
      {showDisarmedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 380,
              padding: 24,
              borderRadius: 20,
              background: 'linear-gradient(180deg, rgba(24, 28, 48, 0.98), rgba(14, 18, 32, 0.98))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(245, 158, 11, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                  System Is Disarmed
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Emergency triggers are currently paused
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
              The system is currently <strong>DISARMED</strong>. Would you like to <strong>ARM</strong> it now and trigger the emergency countdown?
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowDisarmedModal(false)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleArmAndTrigger}
                style={{
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                }}
              >
                ARM &amp; Trigger SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
