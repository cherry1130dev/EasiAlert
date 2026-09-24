import React from 'react';
import { AlertCircle, MapPin, StopCircle, RefreshCw, CheckCircle2, PhoneCall, MessageSquare, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ActiveAlertCard: React.FC = () => {
  const { activeSession, cancelEmergency, dismissEmergency } = useApp();

  if (!activeSession || activeSession.status === 'COUNTDOWN') {
    return null;
  }

  const isOngoing = activeSession.status === 'DISPATCHING' || activeSession.status === 'WAITING_REPEAT';
  const isCancelled = activeSession.status === 'CANCELLED';
  const isCompleted = activeSession.status === 'COMPLETED';

  return (
    <div
      className={`glass-panel ${isOngoing ? 'glass-panel-danger' : ''}`}
      style={{
        padding: '16px',
        marginBottom: '20px',
        borderWidth: 2,
        borderColor: isOngoing ? '#ef4444' : isCancelled ? '#64748b' : '#10b981',
      }}
    >
      {/* Header & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isOngoing ? (
            <AlertCircle size={22} color="#ef4444" className="animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 size={22} color="#10b981" />
          ) : (
            <StopCircle size={22} color="#94a3b8" />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {isOngoing ? 'Emergency Alert Active' : isCompleted ? 'Alert Cycle Complete' : 'Alert Stopped'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Origin: {activeSession.triggerDeviceName}
            </div>
          </div>
        </div>

        {/* Iteration Badge */}
        <div
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {activeSession.maxIterations === 1
            ? 'Single Blast (1x)'
            : `Cycle ${activeSession.currentIteration} / ${activeSession.maxIterations === -1 ? '∞' : activeSession.maxIterations}`}
        </div>
      </div>

      {/* Repeating Status or Next Repeat Countdown */}
      {activeSession.status === 'WAITING_REPEAT' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#fca5a5' }}>
            <RefreshCw size={16} className="animate-spin" />
            <span>Next repeat update in:</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
            {activeSession.nextRepeatCountdown}s
          </span>
        </div>
      )}

      {/* Location link if available */}
      {activeSession.googleMapsUrl && (
        <div style={{ marginBottom: 12 }}>
          <a
            href={activeSession.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              fontSize: '0.8rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#60a5fa" />
              {activeSession.coords?.latitude.toFixed(4)}, {activeSession.coords?.longitude.toFixed(4)} (Google Maps)
            </span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Real-time Dispatch Logs */}
      <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 14 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
          Live Transmission Log
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activeSession.logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: '0.75rem',
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ marginTop: 2 }}>
                {log.type === 'SMS' && <MessageSquare size={13} color="#38bdf8" />}
                {log.type === 'CALL' && <PhoneCall size={13} color="#4ade80" />}
                {log.type === 'GPS' && <MapPin size={13} color="#f59e0b" />}
                {log.type === 'SYSTEM' && <AlertCircle size={13} color="#94a3b8" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                    {log.targetName ? `${log.targetName} (${log.targetPhone})` : log.content}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{log.timestamp}</span>
                </div>
                {log.details && <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{log.details}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        {isOngoing ? (
          <button
            onClick={() => cancelEmergency('Manual user stop')}
            className="btn btn-danger"
            style={{ flex: 1, padding: '10px' }}
          >
            <StopCircle size={18} /> STOP EMERGENCY ALERT
          </button>
        ) : (
          <button
            onClick={dismissEmergency}
            className="btn btn-outline"
            style={{ flex: 1, padding: '10px' }}
          >
            Dismiss Log
          </button>
        )}
      </div>
    </div>
  );
};
