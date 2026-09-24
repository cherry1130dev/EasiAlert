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
  X,
  Power,
  Navigation as NavIcon,
} from 'lucide-react';
import { permissionService, type AppPermissionsStatus } from '../../services/permissionService';

const SESSION_DISMISSED_KEY = 'easisafity_permissions_modal_dismissed';

export const PermissionGuardModal: React.FC = () => {
  const [status, setStatus] = useState<AppPermissionsStatus>(() => permissionService.getStatus());
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    // Check immediately on startup
    permissionService.checkAllPermissions();

    // Check on status changes
    const unsub = permissionService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Check again whenever the app resumes or window regains focus (e.g. user returns from Android Settings or Bluetooth toggle)
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

  // If user dismissed it for this session, don't show
  if (isDismissed) {
    return null;
  }

  // If all permissions are granted and hardware radios are on, hide completely
  const isBtOff = status.isBluetoothOn === false;
  const isLocOff = status.isLocationOn === false;
  const hasMissingPermissions = !status.allGranted;

  if (!hasMissingPermissions && !isBtOff && !isLocOff) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
  };

  const handleGrant = async () => {
    setIsRequesting(true);
    await permissionService.requestAllPermissions();
    setTimeout(() => {
      permissionService.checkAllPermissions();
      setIsRequesting(false);
    }, 1200);
  };

  const handleEnableBluetooth = () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.requestEnableBluetooth) {
      window.AndroidBridge.requestEnableBluetooth();
    }
    setTimeout(() => {
      permissionService.checkAllPermissions();
    }, 1500);
  };

  const handleEnableLocation = () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.openLocationSettings) {
      window.AndroidBridge.openLocationSettings();
    }
    setTimeout(() => {
      permissionService.checkAllPermissions();
    }, 1500);
  };

  const handleOpenSettings = () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.openAppSettings) {
      window.AndroidBridge.openAppSettings();
    }
  };

  const items = [
    {
      title: 'SMS Permission',
      desc: 'Sends automated emergency SMS with live GPS link to your saved contacts',
      icon: MessageSquare,
      granted: status.sms === 'granted',
    },
    {
      title: 'Contacts / Phonebook',
      desc: 'Allows choosing emergency numbers directly from your phonebook',
      icon: Users,
      granted: status.contacts === 'granted',
    },
    {
      title: 'GPS Location',
      desc: 'Acquires high-accuracy coordinates to generate a live Google Maps location link',
      icon: MapPin,
      granted: status.location === 'granted',
    },
    {
      title: 'Bluetooth Permission',
      desc: 'Connects to wearable hardware triggers (HC-05 / ESP32)',
      icon: Bluetooth,
      granted: status.bluetooth === 'granted',
    },
    {
      title: 'Notifications & Foreground',
      desc: 'Ensures background hardware trigger monitoring even when screen is locked',
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
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.12)',
          background: 'linear-gradient(180deg, rgba(20, 24, 40, 0.98), rgba(12, 15, 26, 0.98))',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
        }}
      >
        {/* Close / Dismiss 'X' Button on top-right */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Device &amp; Hardware Setup
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Ensure hardware triggers &amp; emergency alerts work reliably
            </div>
          </div>
        </div>

        {/* Hardware Toggles: Bluetooth & Location Switches if Turned OFF */}
        {(isBtOff || isLocOff) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isBtOff && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ color: '#ef4444' }}>
                    <Bluetooth size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>
                      Bluetooth is Turned OFF
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Turn ON to connect your wearable trigger button
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEnableBluetooth}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Power size={13} /> Turn ON
                </button>
              </div>
            )}

            {isLocOff && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ color: '#f59e0b' }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fde68a' }}>
                      Location (GPS) is Turned OFF
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Turn ON so emergency SMS includes live Google Maps link
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEnableLocation}
                  style={{
                    background: '#f59e0b',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <NavIcon size={13} /> Turn ON
                </button>
              </div>
            )}
          </div>
        )}

        {/* Permissions Checklist */}
        {hasMissingPermissions && (
          <>
            <p style={{ fontSize: '0.80rem', color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
              Allow permissions for background SMS dispatch and Bluetooth connection:
            </p>

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
                        <Icon size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.80rem', fontWeight: 700, color: item.granted ? '#86efac' : '#f1f5f9' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
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
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            color: '#22c55e',
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'rgba(34, 197, 94, 0.15)',
                          }}
                        >
                          <CheckCircle2 size={11} /> Allowed
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            color: '#f59e0b',
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'rgba(245, 158, 11, 0.15)',
                          }}
                        >
                          <AlertCircle size={11} /> Required
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {hasMissingPermissions && (
            <button
              onClick={handleGrant}
              disabled={isRequesting}
              className="btn-primary"
              style={{
                padding: '12px 18px',
                fontSize: '0.90rem',
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
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleOpenSettings}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '0.75rem',
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
              <ExternalLink size={13} /> App Settings
            </button>

            <button
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
