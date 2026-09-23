import React from 'react';
import { AlertTriangle, XCircle, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { emergencyPipeline } from '../../services/emergencyPipeline';

export const CountdownOverlay: React.FC = () => {
  const { activeSession, cancelEmergency, activeProfile, contacts, userName } = useApp();

  if (!activeSession || activeSession.status !== 'COUNTDOWN') {
    return null;
  }

  const remaining = activeSession.countdownRemaining;
  const total = activeProfile.gracePeriodSeconds || 10;
  const progressPercent = Math.max(0, Math.min(100, (remaining / total) * 100));

  const eligibleSmsCount = contacts.filter((c) => c.enabled && (c.role === 'SMS' || c.role === 'BOTH')).length;
  const priorityContact = contacts.find((c) => c.enabled && (c.isPriority || c.role === 'CALL' || c.role === 'BOTH'));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 15, 29, 0.96)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '36px 20px',
        textAlign: 'center',
      }}
    >
      {/* Top Warning Banner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 9999,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#f87171',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          <AlertTriangle size={18} className="animate-bounce" />
          Emergency Alert Triggered
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Signal received from: <strong style={{ color: '#f8fafc' }}>{activeSession.triggerDeviceName}</strong>
        </p>
      </div>

      {/* Giant Countdown Dial */}
      <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* SVG Progress Circle */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle
            cx="110"
            cy="110"
            r="96"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="110"
            cy="110"
            r="96"
            stroke="#ef4444"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 96}
            strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: '#ffffff', textShadow: '0 0 25px rgba(239, 68, 68, 0.8)' }}>
            {remaining}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            Seconds Left
          </span>
        </div>
      </div>

      {/* Target Info */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.06)',
          borderColor: 'rgba(239, 68, 68, 0.25)',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
          Dispatching in <strong style={{ color: 'white' }}>{remaining}s</strong> to:
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.82rem', color: '#cbd5e1' }}>
          <div>
            📱 SMS: <strong style={{ color: '#38bdf8' }}>{eligibleSmsCount} contacts</strong>
          </div>
          {activeProfile.callPriorityContact && priorityContact && (
            <div>
              📞 Call: <strong style={{ color: '#4ade80' }}>{priorityContact.name.split(' ')[0]}</strong>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 8 }}>
          📍 Live GPS location link will be attached.
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 380 }}>
        {/* Giant Cancel Button */}
        <button
          onClick={() => cancelEmergency('Cancelled by user tap')}
          style={{
            width: '100%',
            height: 60,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          }}
        >
          <XCircle size={26} />
          I AM SAFE (CANCEL ALERT)
        </button>

        {/* Skip countdown and dispatch now */}
        <button
          onClick={() => {
            emergencyPipeline.dispatchNow(activeProfile, contacts, userName);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 8,
          }}
        >
          <Send size={13} /> False alarm abort available above.
        </button>
      </div>
    </div>
  );
};
