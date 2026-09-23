import React from 'react';
import { Bluetooth, BluetoothConnected, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { isArmed, pairedDevice, connectionStatus, toggleArmed, userName } = useApp();

  const isBtConnected = connectionStatus === 'CONNECTED';

  return (
    <header
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 36px) + 6px)',
        paddingBottom: '10px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.98)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="/logo.png"
          alt="EASITRONICS Logo"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(245, 158, 11, 0.5)',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
          }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
            EasiAlert
            <span style={{ fontSize: '0.62rem', background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
              EASITRONICS
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={10} /> {userName}
          </div>
        </div>
      </div>

      {/* Arm Status & BT Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Bluetooth Online/Offline indicator pill */}
        <div
          title={isBtConnected ? `ONLINE: Connected to ${pairedDevice?.name}` : 'OFFLINE: No Bluetooth device connected'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 8,
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            background: isBtConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
            color: isBtConnected ? '#34d399' : '#f87171',
            border: `1px solid ${isBtConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isBtConnected ? '#10b981' : '#ef4444',
              boxShadow: isBtConnected ? '0 0 6px #10b981' : 'none',
            }}
          />
          {isBtConnected ? <BluetoothConnected size={13} /> : <Bluetooth size={13} />}
          <span>{isBtConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* Master Arm Switch button */}
        <button
          onClick={toggleArmed}
          className={`badge ${isArmed ? 'badge-armed' : 'badge-disarmed'}`}
          style={{ cursor: 'pointer', border: 'none', padding: '6px 12px' }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isArmed ? '#10b981' : '#64748b',
              boxShadow: isArmed ? '0 0 8px #10b981' : 'none',
            }}
          />
          {isArmed ? 'ARMED' : 'DISARMED'}
        </button>
      </div>
    </header>
  );
};
