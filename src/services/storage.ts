import type { Contact } from '../types/contact';
import { DEFAULT_CONTACTS } from '../types/contact';
import type { AlertProfile } from '../types/alertProfile';
import { ALERT_PRESETS } from '../types/alertProfile';
import type { BluetoothTriggerConfig, BluetoothDevice } from '../types/bluetooth';
import { DEFAULT_TRIGGER_CONFIG, MOCK_BLUETOOTH_DEVICES } from '../types/bluetooth';
import type { AppThemeId } from '../types/theme';

const KEYS = {
  CONTACTS: 'easisafity_contacts_v1',
  ACTIVE_PROFILE: 'easisafity_profile_v1',
  SAVED_PROFILES: 'easisafity_custom_profiles_v1',
  TRIGGER_CONFIG: 'easisafity_trigger_config_v1',
  PAIRED_DEVICE: 'easisafity_paired_device_v1',
  IS_ARMED: 'easisafity_is_armed_v1',
  USER_NAME: 'easisafity_user_name_v1',
  ACTIVE_THEME: 'easisafity_active_theme_v1',
  CUSTOM_THEME: 'easisafity_custom_theme_v1',
};

export const storageService = {
  getActiveTheme(): AppThemeId {
    try {
      const data = localStorage.getItem(KEYS.ACTIVE_THEME);
      return (data as AppThemeId) || 'SOS';
    } catch {
      return 'SOS';
    }
  },

  saveActiveTheme(themeId: AppThemeId): void {
    try {
      localStorage.setItem(KEYS.ACTIVE_THEME, themeId);
    } catch (e) {
      console.error('Failed to save active theme', e);
    }
  },

  getCustomTheme(): any | null {
    try {
      const data = localStorage.getItem(KEYS.CUSTOM_THEME);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCustomTheme(theme: any): void {
    try {
      localStorage.setItem(KEYS.CUSTOM_THEME, JSON.stringify(theme));
    } catch (e) {
      console.error('Failed to save custom theme', e);
    }
  },

  getContacts(): Contact[] {
    try {
      const data = localStorage.getItem(KEYS.CONTACTS);
      return data ? JSON.parse(data) : DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  },

  saveContacts(contacts: Contact[]): void {
    try {
      localStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
    } catch (e) {
      console.error('Failed to save contacts to localStorage', e);
    }
  },

  getActiveProfile(): AlertProfile {
    try {
      const data = localStorage.getItem(KEYS.ACTIVE_PROFILE);
      return data ? JSON.parse(data) : ALERT_PRESETS.PERSONAL;
    } catch {
      return ALERT_PRESETS.PERSONAL;
    }
  },

  saveActiveProfile(profile: AlertProfile): void {
    try {
      localStorage.setItem(KEYS.ACTIVE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save active profile', e);
    }
  },

  getTriggerConfig(): BluetoothTriggerConfig {
    try {
      const data = localStorage.getItem(KEYS.TRIGGER_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_TRIGGER_CONFIG;
    } catch {
      return DEFAULT_TRIGGER_CONFIG;
    }
  },

  saveTriggerConfig(config: BluetoothTriggerConfig): void {
    try {
      localStorage.setItem(KEYS.TRIGGER_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save trigger config', e);
    }
  },

  getPairedDevice(): BluetoothDevice | null {
    try {
      const data = localStorage.getItem(KEYS.PAIRED_DEVICE);
      return data ? JSON.parse(data) : MOCK_BLUETOOTH_DEVICES[0];
    } catch {
      return null;
    }
  },

  savePairedDevice(device: BluetoothDevice | null): void {
    try {
      if (device) {
        localStorage.setItem(KEYS.PAIRED_DEVICE, JSON.stringify(device));
      } else {
        localStorage.removeItem(KEYS.PAIRED_DEVICE);
      }
    } catch (e) {
      console.error('Failed to save paired device', e);
    }
  },

  getIsArmed(): boolean {
    try {
      const data = localStorage.getItem(KEYS.IS_ARMED);
      return data ? JSON.parse(data) : true;
    } catch {
      return true;
    }
  },

  saveIsArmed(armed: boolean): void {
    try {
      localStorage.setItem(KEYS.IS_ARMED, JSON.stringify(armed));
    } catch (e) {
      console.error('Failed to save isArmed', e);
    }
  },

  getUserName(): string {
    try {
      return localStorage.getItem(KEYS.USER_NAME) || 'Alex';
    } catch {
      return 'Alex';
    }
  },

  saveUserName(name: string): void {
    try {
      localStorage.setItem(KEYS.USER_NAME, name);
    } catch (e) {
      console.error('Failed to save userName', e);
    }
  },
};
