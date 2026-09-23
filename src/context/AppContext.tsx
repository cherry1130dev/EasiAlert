import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Contact } from '../types/contact';
import type { AlertProfile, AlertPresetType } from '../types/alertProfile';
import { ALERT_PRESETS } from '../types/alertProfile';
import type { AppThemeId, AppTheme } from '../types/theme';
import { APP_THEMES, buildCustomTheme } from '../types/theme';
import type {
  BluetoothDevice,
  BluetoothConnectionStatus,
  BluetoothTriggerConfig,
  SerialLogEntry,
} from '../types/bluetooth';
import type { EmergencySession } from '../types/emergency';
import { storageService } from '../services/storage';
import { bluetoothService } from '../services/bluetoothService';
import { emergencyPipeline } from '../services/emergencyPipeline';

interface AppContextValue {
  // Armed state
  isArmed: boolean;
  toggleArmed: () => void;
  userName: string;
  setUserName: (name: string) => void;

  // Contacts
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  toggleContactEnabled: (id: string) => void;
  setPriorityContact: (id: string) => void;

  // Theme
  activeTheme: AppThemeId;
  themeConfig: AppTheme;
  customTheme: AppTheme;
  setActiveTheme: (themeId: AppThemeId) => void;
  updateCustomTheme: (options: { color: string; name?: string; template?: string }) => void;

  // Alert Profile
  activeProfile: AlertProfile;
  updateActiveProfile: (profile: AlertProfile) => void;
  selectPreset: (type: AlertPresetType) => void;

  // Bluetooth
  pairedDevice: BluetoothDevice | null;
  connectionStatus: BluetoothConnectionStatus;
  triggerConfig: BluetoothTriggerConfig;
  updateTriggerConfig: (config: BluetoothTriggerConfig) => void;
  scanForDevices: () => Promise<BluetoothDevice[]>;
  connectToDevice: (device: BluetoothDevice) => Promise<boolean>;
  disconnectDevice: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<boolean>;
  serialLogs: SerialLogEntry[];
  clearSerialLogs: () => void;

  // Emergency Session & Pipeline
  activeSession: EmergencySession | null;
  triggerEmergency: (source?: 'MANUAL_APP' | 'BLUETOOTH_HARDWARE' | 'SIMULATION', deviceName?: string) => boolean;
  cancelEmergency: (reason?: string) => void;
  dismissEmergency: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isArmed, setIsArmedState] = useState<boolean>(() => storageService.getIsArmed());
  const [userName, setUserNameState] = useState<string>(() => storageService.getUserName());
  const [contacts, setContacts] = useState<Contact[]>(() => storageService.getContacts());
  const [activeTheme, setActiveThemeState] = useState<AppThemeId>(() => storageService.getActiveTheme());
  const [activeProfile, setActiveProfileState] = useState<AlertProfile>(() => storageService.getActiveProfile());
  const [triggerConfig, setTriggerConfigState] = useState<BluetoothTriggerConfig>(() => storageService.getTriggerConfig());
  const [pairedDevice, setPairedDeviceState] = useState<BluetoothDevice | null>(() => storageService.getPairedDevice());
  const [connectionStatus, setConnectionStatus] = useState<BluetoothConnectionStatus>('DISCONNECTED');
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>([]);
  const [activeSession, setActiveSession] = useState<EmergencySession | null>(() => emergencyPipeline.getCurrentSession());

  // Mutable refs to ensure background Bluetooth triggers always use the latest Emergency Execution Parameters
  const activeProfileRef = useRef(activeProfile);
  activeProfileRef.current = activeProfile;

  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;

  const userNameRef = useRef(userName);
  userNameRef.current = userName;

  const [customTheme, setCustomTheme] = useState<AppTheme>(() => storageService.getCustomTheme() || APP_THEMES.CUSTOM);

  const themeConfig = activeTheme === 'CUSTOM' ? customTheme : (APP_THEMES[activeTheme] || APP_THEMES.SOS);

  const updateCustomTheme = (options: { color: string; name?: string; template?: string }) => {
    const updated = buildCustomTheme(options.color, options.name || customTheme.name, options.template || customTheme.defaultTemplate);
    setCustomTheme(updated);
    storageService.saveCustomTheme(updated);
  };

  // Apply dynamic CSS variables whenever active theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', themeConfig.primaryColor);
    root.style.setProperty('--theme-glow', themeConfig.glowColor);
    root.style.setProperty('--theme-gradient', themeConfig.gradient);
    root.style.setProperty('--theme-badge-bg', themeConfig.badgeBg);
    root.style.setProperty('--theme-badge-color', themeConfig.badgeColor);
    root.style.setProperty('--theme-border', themeConfig.borderAccent);
    root.style.setProperty('--color-emergency', themeConfig.primaryColor);
    root.style.setProperty('--color-emergency-glow', themeConfig.glowColor);
  }, [themeConfig]);

  const setActiveTheme = (themeId: AppThemeId) => {
    setActiveThemeState(themeId);
    storageService.saveActiveTheme(themeId);
  };

  // Initialize pipeline & Bluetooth listener
  useEffect(() => {
    emergencyPipeline.setArmed(isArmed);
    bluetoothService.setTriggerConfig(triggerConfig);

    // Listen to session state changes from pipeline
    const unsubSession = emergencyPipeline.onSessionUpdate((session) => {
      setActiveSession(session);
    });

    // Listen to Bluetooth status
    const unsubStatus = bluetoothService.onStatusChange((status, dev) => {
      setConnectionStatus(status);
      if (dev) {
        setPairedDeviceState(dev);
        storageService.savePairedDevice(dev);
      }
    });

    // Listen to incoming serial monitor data
    const unsubSerial = bluetoothService.onSerialData((entry) => {
      setSerialLogs((prev) => [entry, ...prev.slice(0, 75)]);
    });

    // Handle physical trigger from Bluetooth module using freshest parameters
    const unsubTrigger = bluetoothService.onTrigger((source, rawData) => {
      console.log(`[Hardware Trigger] Received "${rawData}" from ${source}`);
      const latestProfile = activeProfileRef.current || storageService.getActiveProfile();
      const latestContacts = contactsRef.current || storageService.getContacts();
      const latestUserName = userNameRef.current || storageService.getUserName();
      console.log(`[Hardware Trigger] Executing with gracePeriod: ${latestProfile.gracePeriodSeconds}s, repeat: ${latestProfile.repeatIntervalSeconds}s`);
      emergencyPipeline.triggerAlert('BLUETOOTH_HARDWARE', latestProfile, latestContacts, latestUserName, source);
    });

    // Auto-connect to paired device on launch if available
    if (pairedDevice && triggerConfig.autoReconnect) {
      bluetoothService.connectDevice(pairedDevice);
    }

    return () => {
      unsubSession();
      unsubStatus();
      unsubSerial();
      unsubTrigger();
    };
  }, []);

  // Sync isArmed changes
  const toggleArmed = () => {
    const next = !isArmed;
    setIsArmedState(next);
    storageService.saveIsArmed(next);
    emergencyPipeline.setArmed(next);
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    storageService.saveUserName(name);
  };

  // Contacts handlers
  const addContact = (contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contactData,
      id: `c_${Date.now()}`,
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  const updateContact = (updatedContact: Contact) => {
    const updated = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c));
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  const deleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  const toggleContactEnabled = (id: string) => {
    const updated = contacts.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  const setPriorityContact = (id: string) => {
    const updated = contacts.map((c) => ({
      ...c,
      isPriority: c.id === id,
    }));
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  // Profile handlers
  const updateActiveProfile = (profile: AlertProfile) => {
    activeProfileRef.current = profile;
    setActiveProfileState(profile);
    storageService.saveActiveProfile(profile);
  };

  const selectPreset = (type: AlertPresetType) => {
    const preset = ALERT_PRESETS[type];
    if (preset) {
      updateActiveProfile({ ...preset });
    }
  };

  // Bluetooth handlers
  const updateTriggerConfig = (config: BluetoothTriggerConfig) => {
    setTriggerConfigState(config);
    storageService.saveTriggerConfig(config);
    bluetoothService.setTriggerConfig(config);
  };

  const scanForDevices = async () => {
    return await bluetoothService.scanDevices();
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    const ok = await bluetoothService.connectDevice(device);
    if (ok) {
      setPairedDeviceState(device);
      storageService.savePairedDevice(device);
    }
    return ok;
  };

  const disconnectDevice = async () => {
    await bluetoothService.disconnect();
    setPairedDeviceState(null);
    storageService.savePairedDevice(null);
  };

  const sendCommand = async (cmd: string) => {
    return await bluetoothService.sendCommand(cmd);
  };

  const clearSerialLogs = () => {
    setSerialLogs([]);
  };

  // Emergency handlers
  const triggerEmergency = (
    source: 'MANUAL_APP' | 'BLUETOOTH_HARDWARE' | 'SIMULATION' = 'MANUAL_APP',
    deviceName?: string
  ) => {
    return emergencyPipeline.triggerAlert(source, activeProfile, contacts, userName, deviceName);
  };

  const cancelEmergency = (reason?: string) => {
    emergencyPipeline.cancelAlert(reason);
  };

  const dismissEmergency = () => {
    emergencyPipeline.dismissSession();
  };

  const value: AppContextValue = {
    isArmed,
    toggleArmed,
    userName,
    setUserName,
    contacts,
    addContact,
    updateContact,
    deleteContact,
    toggleContactEnabled,
    setPriorityContact,
    activeTheme,
    themeConfig,
    customTheme,
    setActiveTheme,
    updateCustomTheme,
    activeProfile,
    updateActiveProfile,
    selectPreset,
    pairedDevice,
    connectionStatus,
    triggerConfig,
    updateTriggerConfig,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    sendCommand,
    serialLogs,
    clearSerialLogs,
    activeSession,
    triggerEmergency,
    cancelEmergency,
    dismissEmergency,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
