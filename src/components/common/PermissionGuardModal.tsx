import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Users,
  MapPin,
  Bluetooth,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { permissionService, type AppPermissionsStatus } from '../../services/permissionService';

export const PermissionGuardModal: React.FC = () => {
  const [status, setStatus] = useState<AppPermissionsStatus>(() => permissionService.getStatus());
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check immediately on startup
    permissionService.checkAllPermissions();

    // Check on status changes
    const unsub = permissionService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Check again whenever the app resumes or window regains focus (e.g. user returns from Android Settings)
    const handleResume = () => {
      permissionService.checkAllPermissions();
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    });

    return () => {
      unsub();
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  if (status.allGranted) {
    return null;
  }

  const handleGrant = async () => {
    setIsRequesting(true);
    await permissionService.requestAllPermissions();
    setTimeout(() => {
      permissionService.checkAllPermissions();
      setIsRequesting(false);
    }, 1200);
  };

  const handleOpenSettings = () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.openAppSettings) {
      window.AndroidBridge.openAppSettings();
    } else {
      alert('Please open your phone Settings > Apps > EasiAlert > Permissions to grant permissions.');
    }
  };

  const items = [
    {
      title: 'SMS Permission',
      desc: 'Automatically sends emergency SMS to saved contacts upon hardware trigger',
      icon: MessageSquare,
      granted: status.sms === 'granted',
    },
    {
      title: 'Contacts / Phonebook',
      desc: 'Access your phonebook to select emergency contacts and priority numbers',
      icon: Users,
      granted: status.contacts === 'granted',
    },
    {
      title: 'GPS Location',
      desc: 'Acquires high-accuracy coordinates and attaches a live Google Maps link',
      icon: MapPin,
      granted: status.location === 'granted',
    },
    {
      title: 'Bluetooth Connection',
      desc: 'Connects to wearable buttons and IoT hardware (HC-05 / ESP32)',
      icon: Bluetooth,
      granted: status.bluetooth === 'granted',
    },
    {
      title: 'Notifications & Service',
      desc: 'Ensures 24/7 background execution even when screen is locked',
      icon: Bell,
      granted: status.notification === 'granted',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 8, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 20,
          padding: '24px 20px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
          background: 'linear-gradient(180deg, rgba(20, 24, 40, 0.98), rgba(12, 15, 26, 0.98))',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Permissions Required
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Please allow permissions for EasiAlert
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
          To automatically send emergency SMS and connect with your Bluetooth hardware without interruptions, EasiAlert requires the following device permissions:
        </p>

        {/* Permissions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: item.granted ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${item.granted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      color: item.granted ? '#22c55e' : '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: item.granted ? '#86efac' : '#f1f5f9' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div>
                  {item.granted ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#22c55e',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(34, 197, 94, 0.15)',
                      }}
                    >
                      <CheckCircle2 size={12} /> Allowed
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      <AlertCircle size={12} /> Required
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            onClick={handleGrant}
            disabled={isRequesting}
            className="btn-primary"
            style={{
              padding: '12px 18px',
              fontSize: '0.92rem',
              fontWeight: 800,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            <ShieldCheck size={18} />
            {isRequesting ? 'Requesting Permissions...' : 'Allow All Permissions'}
          </button>

          <button
            onClick={handleOpenSettings}
            style={{
              padding: '10px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <ExternalLink size={14} /> Open Device App Settings
          </button>
        </div>
      </div>
    </div>
  );
};
