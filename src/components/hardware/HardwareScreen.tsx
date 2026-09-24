import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  RefreshCw,
  Terminal,
  Cpu,
  Trash2,
  Radio,
  Send,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { BluetoothDevice, TriggerMatchMode } from '../../types/bluetooth';
import { permissionService, type AppPermissionsStatus } from '../../services/permissionService';
import { CollapsibleCard } from '../common/CollapsibleCard';

export const HardwareScreen: React.FC = () => {
  const {
    pairedDevice,
    connectionStatus,
    connectToDevice,
    disconnectDevice,
    scanForDevices,
    sendCommand,
    triggerConfig,
    updateTriggerConfig,
    serialLogs,
    clearSerialLogs,
  } = useApp();

  const [scannedDevices, setScannedDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [permStatus, setPermStatus] = useState<AppPermissionsStatus>(() => permissionService.getStatus());
  const [isRequestingPerms, setIsRequestingPerms] = useState(false);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);

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

  const handleScan = async () => {
    setIsScanning(true);
    const devices = await scanForDevices();
    setScannedDevices(devices);
    setIsScanning(false);
  };

  const handleConnect = async (dev: BluetoothDevice) => {
    setConnectingAddress(dev.address || dev.name || 'connecting');
    try {
      await connectToDevice(dev);
    } finally {
      setConnectingAddress(null);
    }
  };

  const handleDisconnect = async () => {
    await disconnectDevice();
  };

  const handleSendCommand = async (cmdToSend?: string) => {
    const text = (cmdToSend !== undefined ? cmdToSend : commandText).trim();
    if (!text) return;
    setIsSending(true);
    await sendCommand(text);
    if (cmdToSend === undefined) {
      setCommandText('');
    }
    setIsSending(false);
  };

  const isConnected = connectionStatus === 'CONNECTED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Info */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Hardware & Bluetooth</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Manage device connection, trigger parameters, and live terminal console
        </p>
      </div>

      {/* Permissions Check */}
      {!permStatus.allGranted && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 16px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                  Required Hardware &amp; System Permissions
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Bluetooth Connect/Scan, SMS, GPS, Contacts &amp; Notifications
                </div>
              </div>
            </div>
            <button
              onClick={handleGrantPermissions}
              disabled={isRequestingPerms}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#f59e0b', color: '#fbbf24' }}
            >
              {isRequestingPerms ? 'Granting...' : 'Grant All Permissions'}
            </button>
          </div>
        </div>
      )}

      {/* Bluetooth Radio Switch Warning */}
      {permStatus.isBluetoothOn === false && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 16px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bluetooth size={20} color="#ef4444" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5' }}>
                  Bluetooth Is Turned OFF
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Please turn on Bluetooth to connect your hardware trigger button
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                window.AndroidBridge?.requestEnableBluetooth?.();
                setTimeout(() => permissionService.checkAllPermissions(), 1500);
              }}
              className="btn btn-sm"
              style={{ background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700 }}
            >
              Turn ON Bluetooth
            </button>
          </div>
        </div>
      )}

      {/* 1. Connection Status Card */}
      <div
        className="glass-panel"
        style={{
          padding: '18px',
          border: isConnected
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '1px solid var(--border-subtle)',
          background: isConnected
            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 25, 44, 0.8) 100%)'
            : 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                boxShadow: isConnected ? '0 0 16px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              {isConnected ? (
                <BluetoothConnected size={22} color="#10b981" />
              ) : (
                <Bluetooth size={22} color="#64748b" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  {isConnected && pairedDevice ? pairedDevice.name : 'No Hardware Connected'}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                    color: isConnected ? '#34d399' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isConnected ? '#10b981' : '#64748b',
                      boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
                    }}
                  />
                  {isConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {isConnected && pairedDevice
                  ? `Address: ${pairedDevice.address} • ${pairedDevice.type || 'RFCOMM'}`
                  : 'Scan and pair your emergency Bluetooth device below'}
              </div>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button onClick={handleDisconnect} className="btn btn-outline btn-sm" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                Disconnect
              </button>
            ) : (
              <button onClick={handleScan} disabled={isScanning} className="btn btn-primary btn-sm">
                <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                {isScanning ? 'Scanning...' : 'Scan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Device Discovery & Pairing Card */}
      <CollapsibleCard
        title="Nearby Devices & Paired Modules"
        subtitle={`${scannedDevices.length} devices scanned • Tap Connect to pair`}
        icon={<Cpu size={18} color="var(--theme-primary)" />}
        defaultExpanded={true}
        headerRight={
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.70rem', padding: '4px 8px' }}
          >
            <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        }
      >
        {/* Device List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scannedDevices.map((dev) => {
            const isThisConnected = isConnected && pairedDevice?.address === dev.address;
            const isThisDeviceConnecting = connectingAddress === (dev.address || dev.name);
            const isAnyConnecting = connectionStatus === 'CONNECTING' || !!connectingAddress;
            return (
              <div
                key={dev.address}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: isThisConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: isThisConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Radio size={16} color={isThisConnected ? '#10b981' : isThisDeviceConnecting ? 'var(--theme-primary)' : '#64748b'} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{dev.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {dev.address} {dev.isPaired ? '• Paired in Android' : '• Discovered'}
                    </div>
                  </div>
                </div>

                <div>
                  {isThisConnected ? (
                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} /> Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(dev)}
                      disabled={isAnyConnecting}
                      className="btn btn-primary btn-sm"
                      style={{
                        fontSize: '0.75rem',
                        padding: '5px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: isAnyConnecting && !isThisDeviceConnecting ? 0.6 : 1,
                      }}
                    >
                      {isThisDeviceConnecting ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Pairing...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {scannedDevices.length === 0 && !isScanning && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No devices scanned yet. Click <strong>Scan</strong> to search for nearby HC-05, ESP32, or BLE panic triggers.
            </div>
          )}

          {isScanning && (
            <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Scanning Bluetooth frequencies for devices...
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* 3. Trigger Signal Protocol Card */}
      <CollapsibleCard
        title="Hardware Trigger Signal Configuration"
        subtitle={`Match: ${triggerConfig.matchMode} • Cooldown: ${triggerConfig.debounceSeconds || 3}s`}
        icon={<Zap size={18} color="#f59e0b" />}
        defaultExpanded={true}
      >
        {/* Mode Selector */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Detection Match Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {(
              [
                { id: 'ANY_SIGNAL', label: 'ANY SIGNAL' },
                { id: 'CONTAINS', label: 'CONTAINS' },
                { id: 'EXACT', label: 'EXACT' },
                { id: 'BYTE_HEX', label: 'HEX BYTE' },
              ] as Array<{ id: TriggerMatchMode; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => updateTriggerConfig({ ...triggerConfig, matchMode: item.id })}
                style={{
                  padding: '8px 4px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: triggerConfig.matchMode === item.id ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                  background: triggerConfig.matchMode === item.id ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: triggerConfig.matchMode === item.id ? '#fbbf24' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Explanation */}
        {triggerConfig.matchMode === 'ANY_SIGNAL' ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.75rem',
              color: '#93c5fd',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Zap size={16} color="#60a5fa" />
            <span>
              <strong>Any Signal Mode (Recommended):</strong> Automatically activates emergency SMS dispatch upon receiving ANY characters or garbage noise (e.g. <code>....//,/,.,</code> or raw sensor clicks).
            </span>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Expected Trigger String (e.g. ....//,/,., or SOS)
            </label>
            <input
              type="text"
              value={triggerConfig.triggerWord}
              onChange={(e) => updateTriggerConfig({ ...triggerConfig, triggerWord: e.target.value })}
              className="form-input"
              placeholder="....//,/,.,"
            />
          </div>
        )}

        {/* Cooldown Debounce */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Trigger Cooldown (Debounce)</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Prevents duplicate SMS blasts from rapid button chatter
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="range"
              min="1"
              max="30"
              value={triggerConfig.debounceSeconds || 3}
              onChange={(e) => updateTriggerConfig({ ...triggerConfig, debounceSeconds: Number(e.target.value) })}
              style={{ width: 80 }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 32 }}>{triggerConfig.debounceSeconds || 3}s</span>
          </div>
        </div>
      </CollapsibleCard>

      {/* 4. Live Terminal / Manual Control */}
      <CollapsibleCard
        title="Live Hardware Terminal & Console"
        subtitle={`${serialLogs.length} transmission logs recorded`}
        icon={<Terminal size={18} color="#38bdf8" />}
        defaultExpanded={true}
        headerRight={
          <button
            onClick={clearSerialLogs}
            title="Clear logs"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <Trash2 size={15} />
          </button>
        }
      >
        {/* Terminal Screen */}
        <div
          style={{
            height: 180,
            overflowY: 'auto',
            backgroundColor: '#050811',
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: 'monospace',
            fontSize: '0.74rem',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {serialLogs.length === 0 ? (
            <div style={{ color: '#475569', fontStyle: 'italic' }}>
              Waiting for Bluetooth telemetry or serial communication...
            </div>
          ) : (
            serialLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  color: log.isTriggerMatch
                    ? '#ef4444'
                    : log.direction === 'RX'
                    ? '#38bdf8'
                    : log.direction === 'TX'
                    ? '#4ade80'
                    : '#94a3b8',
                  fontWeight: log.isTriggerMatch ? 700 : 400,
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ color: '#475569', marginRight: 6 }}>[{log.timestamp}]</span>
                <span style={{ fontWeight: 600, marginRight: 6 }}>[{log.direction}]</span>
                {log.data}
              </div>
            ))
          )}
        </div>

        {/* Quick Action Command Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>
            Quick TX:
          </span>
          {['PING', 'AT', 'TEST', '....//,/,.,'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleSendCommand(cmd)}
              disabled={isSending}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                fontFamily: 'monospace',
                background: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Manual Command Send Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCommand();
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="text"
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            placeholder="Type custom command to transmit to hardware..."
            className="form-input"
            style={{ fontSize: '0.8rem', padding: '8px 12px', fontFamily: 'monospace' }}
          />
          <button type="submit" disabled={isSending} className="btn btn-primary btn-sm">
            <Send size={14} /> Send
          </button>
        </form>
      </CollapsibleCard>
    </div>
  );
};

