import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  Users,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SosHeroCard } from '../dashboard/SosHeroCard';
import type { NavTab } from '../layout/Navigation';
import { permissionService, type AppPermissionsStatus } from '../../services/permissionService';
import { SmsService } from '../../services/smsService';
import { LocationService } from '../../services/locationService';
import { CollapsibleCard } from '../common/CollapsibleCard';

interface HomeScreenProps {
  onNavigate: (tab: NavTab) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const {
    pairedDevice,
    connectionStatus,
    contacts,
    themeConfig,
    activeProfile,
    userName,
  } = useApp();

  const [permStatus, setPermStatus] = useState<AppPermissionsStatus>(() => permissionService.getStatus());
  const [isRequestingPerms, setIsRequestingPerms] = useState(false);
  const [quickSmsStatus, setQuickSmsStatus] = useState<string | null>(null);

  useEffect(() => {
    permissionService.checkAllPermissions();
    const unsub = permissionService.onStatusChange((status) => {
      setPermStatus(status);
    });
    return unsub;
  }, []);

  const handleGrantPermissions = async () => {
    setIsRequestingPerms(true);
    await permissionService.requestAllPermissions();
    setIsRequestingPerms(false);
  };

  const isBtConnected = connectionStatus === 'CONNECTED';
  const priorityContact = contacts.find((c) => c.enabled && c.isPriority) || contacts.find((c) => c.enabled);

  const handleQuickTestSms = async () => {
    if (!priorityContact) {
      setQuickSmsStatus('⚠️ Add an emergency contact first in the Contacts tab!');
      setTimeout(() => {
        setQuickSmsStatus(null);
        onNavigate('contacts');
      }, 1500);
      return;
    }
    setQuickSmsStatus('Sending direct test SMS...');
    const locResult = await LocationService.getCurrentLocation();
    const testMsg = `[EasiAlert] Safety alert test from ${userName || 'User'}. Location: ${locResult.mapsUrl}`;
    const res = await SmsService.sendSms(priorityContact, testMsg);
    if (res.success) {
      setQuickSmsStatus('Direct Emergency SMS Sent!');
      setTimeout(() => setQuickSmsStatus(null), 3500);
    } else {
      setQuickSmsStatus('Failed to send.');
      setTimeout(() => setQuickSmsStatus(null), 3500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Main SOS Panic Test Button & Master Arm Section */}
      <SosHeroCard />

      {/* 2. Permissions Alert Banner if permissions missing */}
      {!permStatus.allGranted && (
        <div
          className="glass-panel"
          style={{
            padding: '12px 16px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                  Device Permissions Required
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  SMS dispatch, GPS location, Contacts & Bluetooth access
                </div>
              </div>
            </div>
            <button
              onClick={handleGrantPermissions}
              disabled={isRequestingPerms}
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                color: '#000',
                fontWeight: 700,
              }}
            >
              {isRequestingPerms ? 'Granting...' : 'Grant All'}
            </button>
          </div>

          {/* Quick Permission Status Chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[
              { name: 'SMS', granted: permStatus.sms === 'granted' },
              { name: 'Contacts', granted: permStatus.contacts === 'granted' },
              { name: 'GPS', granted: permStatus.location === 'granted' },
              { name: 'Bluetooth', granted: permStatus.bluetooth === 'granted' },
              { name: 'Notifications', granted: permStatus.notification === 'granted' },
            ].map((p) => (
              <span
                key={p.name}
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: p.granted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  color: p.granted ? '#34d399' : 'var(--text-muted)',
                  border: `1px solid ${p.granted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                }}
              >
                {p.granted ? <CheckCircle2 size={10} /> : null} {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. System Status Overview Cards */}
      <CollapsibleCard
        title="System Status Overview"
        subtitle={`BT: ${isBtConnected ? 'ONLINE' : 'OFFLINE'} • Contacts: ${contacts.filter((c) => c.enabled).length} Active • Theme: ${themeConfig.name}`}
        icon={<Sliders size={18} color="var(--theme-primary)" />}
        defaultExpanded={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Hardware Status Card */}
          <div
            onClick={() => onNavigate('hardware')}
            className="glass-panel"
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isBtConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isBtConnected ? (
                  <BluetoothConnected size={18} color="#10b981" />
                ) : (
                  <Bluetooth size={18} color="#64748b" />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Bluetooth Hardware</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 8,
                      background: isBtConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                      color: isBtConnected ? '#34d399' : '#94a3b8',
                    }}
                  >
                    {isBtConnected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {isBtConnected ? pairedDevice?.name : 'Tap to scan and connect HC-05 / ESP32'}
                </div>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>

          {/* Contacts Status Card */}
          <div
            onClick={() => onNavigate('contacts')}
            className="glass-panel"
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Emergency Contacts ({contacts.filter((c) => c.enabled).length} Active)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {priorityContact
                    ? `Priority: ${priorityContact.name} (${priorityContact.phone})`
                    : 'Tap to pick contacts from phonebook'}
                </div>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>

          {/* Protection Theme Card */}
          <div
            onClick={() => onNavigate('alerts')}
            className="glass-panel"
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: themeConfig.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeConfig.primaryColor,
                }}
              >
                <Sliders size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Theme: {themeConfig.name}</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 8,
                      background: themeConfig.badgeBg,
                      color: themeConfig.badgeColor,
                    }}
                  >
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Grace: {activeProfile.gracePeriodSeconds}s • Interval: {activeProfile.repeatIntervalSeconds}s • Tap to customize
                </div>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
        </div>
      </CollapsibleCard>

      {/* 4. Quick Testing Tools */}
      <CollapsibleCard
        title="Quick Testing Tools"
        subtitle="Direct SMS test & native messaging app launcher"
        icon={<Send size={16} color="var(--theme-primary)" />}
        defaultExpanded={true}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <button
            onClick={handleQuickTestSms}
            className="btn btn-outline btn-sm"
            style={{
              padding: '11px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <Send size={14} color="var(--theme-primary)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {quickSmsStatus || 'Test Priority SMS'}
            </span>
          </button>
          <button
            onClick={() => {
              if (priorityContact) {
                SmsService.openMessagingApp(priorityContact.phone, activeProfile.messageTemplate);
              } else {
                onNavigate('contacts');
              }
            }}
            className="btn btn-outline btn-sm"
            style={{
              padding: '11px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <MessageSquare size={14} color="#60a5fa" />
            <span style={{ whiteSpace: 'nowrap' }}>Open SMS App</span>
          </button>
        </div>
      </CollapsibleCard>
    </div>
  );
};
