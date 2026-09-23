export type BluetoothType = 'CLASSIC_RFCOMM' | 'BLE_GATT';

export type BluetoothConnectionStatus =
  | 'DISCONNECTED'
  | 'SCANNING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export interface BluetoothDevice {
  id: string;
  name: string;
  type: BluetoothType;
  address?: string; // MAC address for HC-05 Classic (e.g. 00:18:E4:35:12:AA)
  serviceUuid?: string; // GATT Service UUID for ESP32 BLE (e.g. 4fafc201-1fb5-459e-8fcc-c5c9c331914b)
  characteristicUuid?: string; // GATT Characteristic UUID
  rssi?: number;
  lastSeen?: number;
  isPaired?: boolean;
}

export type TriggerMatchMode = 'ANY_SIGNAL' | 'CONTAINS' | 'EXACT' | 'BYTE_HEX';

export interface BluetoothTriggerConfig {
  triggerWord: string; // e.g. "SOS", "ACCIDENT", "FALL", "PANIC", or garbage signal like "....//,/,.,"
  matchMode: TriggerMatchMode;
  hexValue?: string; // e.g. "0xFF" or "0xAA"
  baudRate: number; // 9600 for default HC-05
  autoReconnect: boolean;
  heartbeatEnabled: boolean;
  debounceSeconds?: number;
}

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'RX' | 'TX' | 'SYSTEM';
  data: string;
  isTriggerMatch?: boolean;
}

export const DEFAULT_TRIGGER_CONFIG: BluetoothTriggerConfig = {
  triggerWord: '....//,/,.,',
  matchMode: 'ANY_SIGNAL',
  hexValue: '0xFF',
  baudRate: 9600,
  autoReconnect: true,
  heartbeatEnabled: false,
  debounceSeconds: 3,
};

export const MOCK_BLUETOOTH_DEVICES: BluetoothDevice[] = [
  {
    id: 'hc05-dev-01',
    name: 'HC-05 Emergency Keyfob',
    type: 'CLASSIC_RFCOMM',
    address: '98:D3:31:F4:9A:88',
    rssi: -62,
    isPaired: true,
  },
  {
    id: 'esp32-safety-02',
    name: 'ESP32 Crash Sensor Wearable',
    type: 'BLE_GATT',
    serviceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    characteristicUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
    rssi: -54,
    isPaired: false,
  },
  {
    id: 'hc05-bike-03',
    name: 'HC-05 Bike Helmet Trigger',
    type: 'CLASSIC_RFCOMM',
    address: '00:14:03:06:01:A2',
    rssi: -78,
    isPaired: false,
  },
];
