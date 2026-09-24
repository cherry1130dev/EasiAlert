import { Geolocation } from '@capacitor/geolocation';
import { BleClient } from '@capacitor-community/bluetooth-le';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface AppPermissionsStatus {
  bluetooth: PermissionState;
  sms: PermissionState;
  location: PermissionState;
  notification: PermissionState;
  contacts: PermissionState;
  allGranted: boolean;
  isBluetoothOn?: boolean;
  isLocationOn?: boolean;
}

type PermissionListener = (status: AppPermissionsStatus) => void;

declare global {
  interface Window {
    sms?: {
      hasPermission?: (success: (hasPerm: boolean) => void, error: (err: unknown) => void) => void;
      requestPermission?: (success: () => void, error: (err: unknown) => void) => void;
      send: (
        phone: string,
        message: string,
        options: { replaceLineBreaks: boolean; android: { intent: string } },
        success: () => void,
        error: (err: unknown) => void
      ) => void;
    };
  }
}

export class PermissionService {
  private static instance: PermissionService;
  private status: AppPermissionsStatus = {
    bluetooth: 'prompt',
    sms: 'prompt',
    location: 'prompt',
    notification: 'prompt',
    contacts: 'prompt',
    allGranted: false,
    isBluetoothOn: true,
    isLocationOn: true,
  };
  private listeners: Set<PermissionListener> = new Set();

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  public getStatus(): AppPermissionsStatus {
    return { ...this.status };
  }

  public onStatusChange(callback: PermissionListener): () => void {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.status.allGranted =
      this.status.bluetooth === 'granted' &&
      this.status.sms === 'granted' &&
      this.status.location === 'granted' &&
      this.status.notification === 'granted' &&
      this.status.contacts === 'granted';

    const current = this.getStatus();
    this.listeners.forEach((cb) => cb(current));
  }

  /**
   * Check all 5 permissions statuses
   */
  public async checkAllPermissions(): Promise<AppPermissionsStatus> {
    // If running in native Android, query the exact native status directly
    if (typeof window !== 'undefined' && window.AndroidBridge?.checkPermissionsStatus) {
      try {
        const raw = window.AndroidBridge.checkPermissionsStatus();
        const parsed = JSON.parse(raw);
        this.status.sms = parsed.sms ? 'granted' : 'prompt';
        this.status.contacts = parsed.contacts ? 'granted' : 'prompt';
        this.status.location = parsed.location ? 'granted' : 'prompt';
        this.status.bluetooth = parsed.bluetooth ? 'granted' : 'prompt';
        this.status.notification = parsed.notifications ? 'granted' : 'prompt';
        this.status.allGranted = !!parsed.allGranted;
        this.status.isBluetoothOn = parsed.isBluetoothOn !== undefined ? !!parsed.isBluetoothOn : true;
        this.status.isLocationOn = parsed.isLocationOn !== undefined ? !!parsed.isLocationOn : true;
        this.notify();
        return this.getStatus();
      } catch (e) {
        console.warn('Native permission check parse error:', e);
      }
    }

    await Promise.allSettled([
      this.checkBluetoothPermission(),
      this.checkLocationPermission(),
      this.checkSmsPermission(),
      this.checkNotificationPermission(),
      this.checkContactsPermission(),
    ]);

    this.notify();
    return this.getStatus();
  }

  /**
   * Request Bluetooth permissions and ensure Bluetooth adapter is enabled
   */
  public async requestBluetoothPermission(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.AndroidBridge?.requestAllPermissions) {
        window.AndroidBridge.requestAllPermissions();
      }
      try {
        await BleClient.initialize();
      } catch (e) {
        console.warn('BleClient initialize note:', e);
      }

      this.status.bluetooth = 'granted';
      this.notify();
      return true;
    } catch (err) {
      console.warn('Bluetooth permission request failed:', err);
      this.status.bluetooth = 'denied';
      this.notify();
      return false;
    }
  }

  public async checkBluetoothPermission(): Promise<PermissionState> {
    if (typeof window !== 'undefined' && window.AndroidBridge?.checkPermissionsStatus) {
      try {
        const raw = window.AndroidBridge.checkPermissionsStatus();
        const parsed = JSON.parse(raw);
        this.status.bluetooth = parsed.bluetooth ? 'granted' : 'prompt';
        this.status.isBluetoothOn = parsed.isBluetoothOn !== undefined ? !!parsed.isBluetoothOn : true;
        return this.status.bluetooth;
      } catch {}
    }
    // Simulation / Web fallback
    this.status.bluetooth = 'granted';
    return 'granted';
  }

  /**
   * Request Location permission (Fine + Coarse GPS)
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      // 1. Capacitor Geolocation plugin
      const result = await Geolocation.requestPermissions({ permissions: ['location'] });
      if (result.location === 'granted') {
        this.status.location = 'granted';
        this.notify();
        return true;
      }
    } catch {
      // 2. Web / Browser Geolocation fallback
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              this.status.location = 'granted';
              this.notify();
              resolve(true);
            },
            () => {
              this.status.location = 'denied';
              this.notify();
              resolve(false);
            },
            { timeout: 5000 }
          );
        });
      }
    }

    this.status.location = 'granted';
    this.notify();
    return true;
  }

  public async checkLocationPermission(): Promise<PermissionState> {
    try {
      const res = await Geolocation.checkPermissions();
      if (res.location === 'granted') {
        this.status.location = 'granted';
        return 'granted';
      }
      if (res.location === 'denied') {
        this.status.location = 'denied';
        return 'denied';
      }
    } catch {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          this.status.location = perm.state as PermissionState;
          return this.status.location;
        } catch {}
      }
    }
    this.status.location = 'prompt';
    return 'prompt';
  }

  /**
   * Request SMS sending permission
   */
  public async requestSmsPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      window.AndroidBridge.requestSmsAndContactsPermissions();
      this.status.sms = window.AndroidBridge.hasSmsPermission() ? 'granted' : 'prompt';
      this.notify();
      return this.status.sms === 'granted';
    }

    this.status.sms = 'granted';
    this.notify();
    return true;
  }

  public async checkSmsPermission(): Promise<PermissionState> {
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      this.status.sms = window.AndroidBridge.hasSmsPermission() ? 'granted' : 'prompt';
      return this.status.sms;
    }
    this.status.sms = 'granted';
    return 'granted';
  }

  /**
   * Request Notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        this.status.notification = res as PermissionState;
        this.notify();
        return res === 'granted';
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
    this.status.notification = 'granted';
    this.notify();
    return true;
  }

  public async checkNotificationPermission(): Promise<PermissionState> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.status.notification = Notification.permission as PermissionState;
      return this.status.notification;
    }
    this.status.notification = 'granted';
    return 'granted';
  }

  /**
   * Check / Request Mobile Contacts permission
   */
  public async requestContactsPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      window.AndroidBridge.requestSmsAndContactsPermissions();
      this.status.contacts = window.AndroidBridge.hasContactsPermission() ? 'granted' : 'prompt';
      this.notify();
      return this.status.contacts === 'granted';
    }

    // Check Contact Picker API support (Modern Android WebViews / Chrome)
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      this.status.contacts = 'granted';
      this.notify();
      return true;
    }

    this.status.contacts = 'granted';
    this.notify();
    return true;
  }

  public async checkContactsPermission(): Promise<PermissionState> {
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      this.status.contacts = window.AndroidBridge.hasContactsPermission() ? 'granted' : 'prompt';
      return this.status.contacts;
    }
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      this.status.contacts = 'granted';
      return 'granted';
    }
    this.status.contacts = 'prompt';
    return 'prompt';
  }

  /**
   * Prompt for all 5 permissions sequentially
   */
  public async requestAllPermissions(): Promise<AppPermissionsStatus> {
    console.log('[Permissions] Requesting all app permissions...');

    // If native bridge exists, launch Android's system permission dialogs immediately
    if (typeof window !== 'undefined' && window.AndroidBridge?.requestAllPermissions) {
      window.AndroidBridge.requestAllPermissions();
    }

    // 1. Bluetooth
    await this.requestBluetoothPermission();
    // 2. Location
    await this.requestLocationPermission();
    // 3. SMS
    await this.requestSmsPermission();
    // 4. Notifications
    await this.requestNotificationPermission();
    // 5. Contacts
    await this.requestContactsPermission();

    return this.checkAllPermissions();
  }
}

export const permissionService = PermissionService.getInstance();
