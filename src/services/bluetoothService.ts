import type {
  BluetoothDevice,
  BluetoothConnectionStatus,
  BluetoothTriggerConfig,
  SerialLogEntry,
} from '../types/bluetooth';
import {
  DEFAULT_TRIGGER_CONFIG,
  MOCK_BLUETOOTH_DEVICES,
} from '../types/bluetooth';
import { permissionService } from './permissionService';

type TriggerCallback = (source: string, rawData: string) => void;
type StatusCallback = (status: BluetoothConnectionStatus, device: BluetoothDevice | null) => void;
type SerialLogCallback = (entry: SerialLogEntry) => void;

declare global {
  interface Window {
    bluetoothSerial?: {
      isEnabled: (success: () => void, failure: () => void) => void;
      enable: (success: () => void, failure: (err: unknown) => void) => void;
      list: (
        success: (devices: Array<{ id?: string; name?: string; address: string }>) => void,
        failure: (err: unknown) => void
      ) => void;
      discoverUnpaired: (
        success: (devices: Array<{ id?: string; name?: string; address: string }>) => void,
        failure: (err: unknown) => void
      ) => void;
      connect: (address: string, success: () => void, failure: (err: unknown) => void) => void;
      disconnect: (success: () => void, failure: () => void) => void;
      isConnected: (success: () => void, failure: () => void) => void;
      subscribe: (delimiter: string, success: (data: string) => void, failure: (err: unknown) => void) => void;
      subscribeRawData: (success: (data: ArrayBuffer) => void, failure: (err: unknown) => void) => void;
      unsubscribe: (success: () => void, failure: () => void) => void;
      unsubscribeRawData: (success: () => void, failure: () => void) => void;
      write: (data: string, success: () => void, failure: (err: unknown) => void) => void;
    };
  }
}

export class BluetoothService {
  private static instance: BluetoothService;
  private status: BluetoothConnectionStatus = 'DISCONNECTED';
  private connectedDevice: BluetoothDevice | null = null;
  private triggerConfig: BluetoothTriggerConfig = DEFAULT_TRIGGER_CONFIG;
  private rxBuffer = '';
  private lastTriggerTime = 0; // Debounce cooldown timestamp

  private triggerListeners: Set<TriggerCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private serialListeners: Set<SerialLogCallback> = new Set();

  public static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  public setTriggerConfig(config: BluetoothTriggerConfig) {
    this.triggerConfig = config;
  }

  public getTriggerConfig(): BluetoothTriggerConfig {
    return this.triggerConfig;
  }

  public getStatus(): BluetoothConnectionStatus {
    return this.status;
  }

  public isOnline(): boolean {
    return this.status === 'CONNECTED';
  }

  public getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  public onTrigger(callback: TriggerCallback): () => void {
    this.triggerListeners.add(callback);
    return () => this.triggerListeners.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status, this.connectedDevice);
    return () => this.statusListeners.delete(callback);
  }

  public onSerialData(callback: SerialLogCallback): () => void {
    this.serialListeners.add(callback);
    return () => this.serialListeners.delete(callback);
  }

  private setStatus(status: BluetoothConnectionStatus, device: BluetoothDevice | null = null) {
    this.status = status;
    this.connectedDevice = device;
    this.statusListeners.forEach((cb) => cb(status, device));
  }

  private logSerial(direction: 'RX' | 'TX' | 'SYSTEM', data: string, isTriggerMatch = false) {
    const entry: SerialLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      direction,
      data,
      isTriggerMatch,
    };
    this.serialListeners.forEach((cb) => cb(entry));
  }

  /**
   * Evaluates incoming serial chunk against configured trigger rule.
   * Supports:
   * - ANY_SIGNAL: Any non-empty transmission/garbage characters (e.g. "....//,/,.,")
   * - CONTAINS: Contains trigger word
   * - EXACT: Exactly matches trigger word
   * - BYTE_HEX: Matches specific hex byte
   */
  public processIncomingChunk(chunk: string) {
    if (!chunk || chunk.length === 0) return;
    this.rxBuffer += chunk;
    this.logSerial('RX', chunk.trimEnd() || `[${chunk.length} bytes received]`);

    // Cooldown check: Prevent duplicate triggers within 5 seconds of an alert
    const now = Date.now();
    if (now - this.lastTriggerTime < 5000) {
      return;
    }

    let isMatch = false;
    const { matchMode, triggerWord, hexValue } = this.triggerConfig;

    if (matchMode === 'ANY_SIGNAL') {
      // Whenever ANY signal/characters (e.g. "....//,/,.," or random noise or button press) arrive:
      if (chunk.trim().length > 0 || this.rxBuffer.trim().length > 0) {
        isMatch = true;
      }
    } else if (matchMode === 'CONTAINS') {
      if (triggerWord && this.rxBuffer.toUpperCase().includes(triggerWord.toUpperCase())) {
        isMatch = true;
      }
    } else if (matchMode === 'EXACT') {
      if (triggerWord && this.rxBuffer.trim().toUpperCase() === triggerWord.trim().toUpperCase()) {
        isMatch = true;
      }
    } else if (matchMode === 'BYTE_HEX' && hexValue) {
      const targetHex = hexValue.replace(/^0x/i, '').toLowerCase();
      for (let i = 0; i < chunk.length; i++) {
        const hex = chunk.charCodeAt(i).toString(16).padStart(2, '0').toLowerCase();
        if (hex === targetHex) {
          isMatch = true;
          break;
        }
      }
    }

    if (isMatch) {
      this.lastTriggerTime = now;
      const matchedData = this.rxBuffer;
      this.rxBuffer = ''; // Reset buffer after trigger
      const label = matchMode === 'ANY_SIGNAL' ? `SIGNAL "${matchedData.trim() || chunk}"` : `RULE "${triggerWord || hexValue}"`;
      this.logSerial('SYSTEM', `🚨 HARDWARE TRIGGER DETECTED: ${label}`, true);
      this.triggerListeners.forEach((cb) => cb(this.connectedDevice?.name || 'Bluetooth Hardware Trigger', matchedData));
    }

    // Keep buffer from growing unbounded if no trigger occurred
    if (this.rxBuffer.length > 512) {
      this.rxBuffer = this.rxBuffer.slice(-256);
    }
  }

  /**
   * Connect to a Bluetooth device (HC-05 Classic or ESP32 BLE) with Online/Offline status tracking
   */
  public async connectDevice(device: BluetoothDevice): Promise<boolean> {
    this.setStatus('CONNECTING', device);
    this.logSerial('SYSTEM', `Connecting to ${device.name} [${device.address || 'GATT'}]...`);

    // 1. Android Native Bluetooth Classic (HC-05) via cordova-plugin-bluetooth-serial
    if (typeof window !== 'undefined' && window.bluetoothSerial && device.address) {
      return new Promise<boolean>((resolve) => {
        window.bluetoothSerial?.connect(
          device.address!,
          () => {
            this.setStatus('CONNECTED', device);
            this.logSerial('SYSTEM', `ONLINE: Connected to ${device.name} via RFCOMM SPP [${device.address}]`);

            // Receiver callback handling both string chunks and raw bytes
            const onRawData = (data: string | ArrayBuffer) => {
              let str = '';
              if (typeof data === 'string') {
                str = data;
              } else if (data instanceof ArrayBuffer) {
                const bytes = new Uint8Array(data);
                str = Array.from(bytes)
                  .map((b) => String.fromCharCode(b))
                  .join('');
              }
              if (str) {
                this.processIncomingChunk(str);
              }
            };

            // Subscribe to raw data if supported so it doesn't wait for '\n'
            if (typeof window.bluetoothSerial?.subscribeRawData === 'function') {
              window.bluetoothSerial.subscribeRawData(
                (data: ArrayBuffer) => onRawData(data),
                (err: unknown) => {
                  this.logSerial('SYSTEM', `Stream error: ${String(err)}`);
                  this.setStatus('DISCONNECTED', null);
                }
              );
            } else {
              // Subscribe with empty string delimiter to receive all raw chunks as they arrive
              window.bluetoothSerial?.subscribe(
                '',
                (data: string) => onRawData(data),
                (err: unknown) => {
                  this.logSerial('SYSTEM', `Stream error: ${String(err)}`);
                  this.setStatus('DISCONNECTED', null);
                }
              );
            }
            resolve(true);
          },
          (err: unknown) => {
            this.setStatus('ERROR', null);
            this.logSerial('SYSTEM', `OFFLINE: Connection failed: ${String(err)}`);
            resolve(false);
          }
        );
      });
    }

    // 2. Web / Browser Simulation Mode
    await new Promise((resolve) => setTimeout(resolve, 600));
    this.setStatus('CONNECTED', device);
    this.logSerial('SYSTEM', `ONLINE: Connected to [SIMULATED] ${device.name}`);
    return true;
  }

  /**
   * Disconnect the active Bluetooth device and set status to OFFLINE
   */
  public async disconnect(): Promise<void> {
    if (typeof window !== 'undefined' && window.bluetoothSerial) {
      try {
        if (window.bluetoothSerial.unsubscribeRawData) {
          window.bluetoothSerial.unsubscribeRawData(() => {}, () => {});
        }
        window.bluetoothSerial.unsubscribe(() => {}, () => {});
        window.bluetoothSerial.disconnect(() => {}, () => {});
      } catch {}
    }
    this.logSerial('SYSTEM', `OFFLINE: Disconnected from device.`);
    this.setStatus('DISCONNECTED', null);
  }

  /**
   * Scans for paired and discoverable Bluetooth Classic & BLE devices with names
   */
  public async scanDevices(): Promise<BluetoothDevice[]> {
    this.setStatus('SCANNING');
    this.logSerial('SYSTEM', 'Requesting permissions and scanning for Bluetooth devices...');

    // 1. Ensure permissions and Bluetooth adapter are active
    await permissionService.requestBluetoothPermission();

    if (typeof window !== 'undefined' && window.bluetoothSerial) {
      try {
        const foundDevicesMap = new Map<string, BluetoothDevice>();

        // Step A: List already paired/bonded devices
        const paired = await new Promise<Array<{ id?: string; name?: string; address: string }>>((resolve) => {
          window.bluetoothSerial?.list(
            (devs) => resolve(devs || []),
            (err) => {
              console.warn('bluetoothSerial.list error:', err);
              resolve([]);
            }
          );
        });

        paired.forEach((d) => {
          const addr = d.address || d.id || '';
          if (!addr) return;
          const cleanName = d.name?.trim() || `HC-05 (${addr.slice(-5)})`;
          foundDevicesMap.set(addr, {
            id: d.id || addr,
            name: cleanName,
            type: 'CLASSIC_RFCOMM',
            address: addr,
            isPaired: true,
          });
        });

        // Step B: Discover nearby unpaired devices
        if (typeof window.bluetoothSerial.discoverUnpaired === 'function') {
          this.logSerial('SYSTEM', 'Discovering nearby unpaired Bluetooth devices...');
          const unpaired = await new Promise<Array<{ id?: string; name?: string; address: string }>>((resolve) => {
            window.bluetoothSerial?.discoverUnpaired(
              (devs) => resolve(devs || []),
              (err) => {
                console.warn('discoverUnpaired note:', err);
                resolve([]);
              }
            );
          });

          unpaired.forEach((d) => {
            const addr = d.address || d.id || '';
            if (!addr || foundDevicesMap.has(addr)) return;
            const cleanName = d.name?.trim() || `Bluetooth Device (${addr.slice(-5)})`;
            foundDevicesMap.set(addr, {
              id: d.id || addr,
              name: cleanName,
              type: 'CLASSIC_RFCOMM',
              address: addr,
              isPaired: false,
            });
          });
        }

        const deviceList = Array.from(foundDevicesMap.values());
        this.setStatus(this.connectedDevice ? 'CONNECTED' : 'DISCONNECTED', this.connectedDevice);
        this.logSerial('SYSTEM', `Found ${deviceList.length} Bluetooth devices with names.`);

        if (deviceList.length > 0) {
          return deviceList;
        }
      } catch (err) {
        console.warn('Native BT scan encountered an issue:', err);
        this.logSerial('SYSTEM', `Scan error: ${String(err)}`);
      }
    }

    // Web simulation scan fallback
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.setStatus(this.connectedDevice ? 'CONNECTED' : 'DISCONNECTED', this.connectedDevice);
    return MOCK_BLUETOOTH_DEVICES;
  }

  /**
   * Sends a manual command string to the connected Bluetooth device
   */
  public async sendCommand(cmd: string): Promise<boolean> {
    const formattedCmd = cmd.endsWith('\n') ? cmd : cmd + '\r\n';
    this.logSerial('TX', formattedCmd.trim());

    if (window.bluetoothSerial && typeof window.bluetoothSerial.write === 'function') {
      return new Promise<boolean>((resolve) => {
        window.bluetoothSerial?.write(
          formattedCmd,
          () => {
            resolve(true);
          },
          (err) => {
            this.logSerial('SYSTEM', `TX Error: ${String(err)}`);
            resolve(false);
          }
        );
      });
    }

    // Web simulation echo for testing
    if (this.status === 'CONNECTED') {
      setTimeout(() => {
        const clean = cmd.trim().toUpperCase();
        if (clean === 'PING') {
          this.logSerial('RX', 'PONG (OK)');
        } else if (clean === 'AT') {
          this.logSerial('RX', 'OK');
        } else if (clean === 'TEST' || clean === 'SOS') {
          this.simulateHardwareSignal(this.triggerConfig.triggerWord || '....//,/,.,');
        } else {
          this.logSerial('RX', `ACK: ${cmd.trim()}`);
        }
      }, 300);
      return true;
    }

    this.logSerial('SYSTEM', 'Cannot send: No Bluetooth device connected.');
    return false;
  }

  /**
   * Simulates incoming hardware transmission (for testing panic triggers without physical hardware)
   */
  public simulateHardwareSignal(triggerString = '....//,/,.,') {
    this.logSerial('RX', `[HARDWARE SIMULATOR] Signal: "${triggerString}"`);
    this.processIncomingChunk(triggerString);
  }
}

export const bluetoothService = BluetoothService.getInstance();
