export type EmergencyStatus =
  | 'IDLE' // Normal state, unprompted
  | 'ARMED' // Armed & actively listening for Bluetooth triggers
  | 'COUNTDOWN' // Grace period ticking down (cancellable)
  | 'DISPATCHING' // Sending SMS, fetching GPS, triggering calls
  | 'WAITING_REPEAT' // Cooldown between repeat loops
  | 'CANCELLED' // User cancelled during countdown or manually disarmed
  | 'COMPLETED'; // Reached max repeats or dismissed

export interface GeoLocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export type DispatchItemType = 'GPS' | 'SMS' | 'CALL' | 'HARDWARE' | 'SYSTEM';
export type DispatchItemStatus = 'PENDING' | 'SENT' | 'SIMULATED' | 'FAILED' | 'CANCELLED';

export interface DispatchLogItem {
  id: string;
  timestamp: string;
  type: DispatchItemType;
  targetName?: string;
  targetPhone?: string;
  content?: string;
  status: DispatchItemStatus;
  details?: string;
}

export interface EmergencySession {
  id: string;
  status: EmergencyStatus;
  startTime: number;
  triggerSource: 'MANUAL_APP' | 'BLUETOOTH_HARDWARE' | 'SIMULATION';
  triggerDeviceName?: string;
  currentIteration: number;
  maxIterations: number;
  countdownRemaining: number;
  nextRepeatCountdown: number;
  coords?: GeoLocationCoords;
  googleMapsUrl?: string;
  logs: DispatchLogItem[];
}
