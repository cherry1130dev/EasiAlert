import type { Contact } from '../types/contact';
import type { AlertProfile } from '../types/alertProfile';
import type {
  EmergencySession,
  DispatchLogItem,
  DispatchItemStatus,
  DispatchItemType,
} from '../types/emergency';
import { LocationService } from './locationService';
import { SmsService } from './smsService';
import { CallService } from './callService';
import { formatEmergencyMessage } from '../utils/messageFormatter';
import { soundManager } from '../utils/audioBeeper';

type SessionUpdateListener = (session: EmergencySession | null) => void;

export class EmergencyPipeline {
  private static instance: EmergencyPipeline;
  private currentSession: EmergencySession | null = null;
  private listeners: Set<SessionUpdateListener> = new Set();

  private countdownTimer: number | null = null;
  private repeatTimer: number | null = null;
  private isArmed = true;

  public static getInstance(): EmergencyPipeline {
    if (!EmergencyPipeline.instance) {
      EmergencyPipeline.instance = new EmergencyPipeline();
    }
    return EmergencyPipeline.instance;
  }

  public setArmed(armed: boolean) {
    this.isArmed = armed;
  }

  public getArmed(): boolean {
    return this.isArmed;
  }

  public getCurrentSession(): EmergencySession | null {
    return this.currentSession;
  }

  public onSessionUpdate(listener: SessionUpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentSession);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentSession ? { ...this.currentSession } : null));
  }

  private addLog(
    type: DispatchItemType,
    status: DispatchItemStatus,
    targetName?: string,
    targetPhone?: string,
    content?: string,
    details?: string
  ) {
    if (!this.currentSession) return;
    const item: DispatchLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      status,
      targetName,
      targetPhone,
      content,
      details,
    };
    this.currentSession.logs.unshift(item); // Prepend so newest is on top
    this.notify();
  }

  /**
   * Primary entry point triggered by either manual button or Bluetooth signal
   */
  public triggerAlert(
    source: 'MANUAL_APP' | 'BLUETOOTH_HARDWARE' | 'SIMULATION',
    profile: AlertProfile,
    contacts: Contact[],
    userName: string,
    deviceName?: string
  ): boolean {
    // If not armed and it's a hardware trigger, reject
    if (!this.isArmed && source === 'BLUETOOTH_HARDWARE') {
      console.warn('Hardware trigger ignored: App is currently DISARMED.');
      return false;
    }

    // If an alert is already in countdown or active dispatch, avoid duplicate collision
    if (this.currentSession && (this.currentSession.status === 'COUNTDOWN' || this.currentSession.status === 'DISPATCHING' || this.currentSession.status === 'WAITING_REPEAT')) {
      console.warn('Alert pipeline is already active.');
      return false;
    }

    const maxIterations =
      profile.maxRepeats === 1 || !profile.isRepeatEnabled
        ? 1
        : profile.maxRepeats;

    // Initialize New Emergency Session
    this.currentSession = {
      id: `sos-${Date.now()}`,
      status: 'COUNTDOWN',
      startTime: Date.now(),
      triggerSource: source,
      triggerDeviceName: deviceName || (source === 'MANUAL_APP' ? 'App Panic Button' : 'Hardware Sensor'),
      currentIteration: 1,
      maxIterations,
      countdownRemaining: profile.gracePeriodSeconds,
      nextRepeatCountdown: 0,
      logs: [],
    };

    this.addLog(
      'SYSTEM',
      'SENT',
      undefined,
      undefined,
      `Emergency Triggered via ${this.currentSession.triggerDeviceName}`,
      `Grace period countdown started (${profile.gracePeriodSeconds}s)`
    );

    // Audio warning
    if (profile.soundAlarmOnPhone) {
      soundManager.startEmergencySiren();
    }

    // Start Grace Period Countdown
    this.startCountdown(profile, contacts, userName);
    return true;
  }

  /**
   * Counts down the grace period. Allows aborting false alarms.
   */
  private startCountdown(profile: AlertProfile, contacts: Contact[], userName: string) {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    if (profile.gracePeriodSeconds <= 0) {
      this.finishCountdownAndDispatch(profile, contacts, userName);
      return;
    }

    this.countdownTimer = window.setInterval(() => {
      if (!this.currentSession || this.currentSession.status !== 'COUNTDOWN') {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        return;
      }

      this.currentSession.countdownRemaining -= 1;
      this.notify();

      if (this.currentSession.countdownRemaining <= 0) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.finishCountdownAndDispatch(profile, contacts, userName);
      }
    }, 1000);
  }

  /**
   * Immediately skips countdown and triggers emergency dispatch
   */
  public dispatchNow(profile: AlertProfile, contacts: Contact[], userName: string) {
    if (!this.currentSession || this.currentSession.status !== 'COUNTDOWN') return;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
    this.finishCountdownAndDispatch(profile, contacts, userName);
  }

  /**
   * Executes the dispatch phase (GPS -> Map Link -> SMS Broadcast -> Phone Call)
   */
  private async finishCountdownAndDispatch(profile: AlertProfile, contacts: Contact[], userName: string) {
    if (!this.currentSession) return;

    soundManager.stopSiren();
    this.currentSession.status = 'DISPATCHING';
    this.notify();

    // 1. Get GPS Location
    this.addLog('GPS', 'PENDING', undefined, undefined, 'Acquiring high-accuracy GPS coordinates...');
    const locationData = await LocationService.getCurrentLocation();
    this.currentSession.coords = locationData.coords;
    this.currentSession.googleMapsUrl = locationData.mapsUrl;

    this.addLog(
      'GPS',
      'SENT',
      undefined,
      undefined,
      `GPS Fix Acquired: ${locationData.coords.latitude.toFixed(5)}, ${locationData.coords.longitude.toFixed(5)}`,
      locationData.mapsUrl
    );

    // 2. Format Message Template
    const emergencyMessage = formatEmergencyMessage(profile.messageTemplate, {
      name: userName,
      location: locationData.mapsUrl,
      coords: locationData.coords,
    });

    // 3. Batch SMS to contacts configured for SMS or BOTH
    const smsContacts = contacts.filter((c) => c.enabled && (c.role === 'SMS' || c.role === 'BOTH'));
    if (smsContacts.length === 0) {
      this.addLog('SYSTEM', 'FAILED', undefined, undefined, 'No active contacts configured for SMS alert.');
    } else {
      for (const contact of smsContacts) {
        this.addLog('SMS', 'PENDING', contact.name, contact.phone, emergencyMessage);
        const result = await SmsService.sendSms(contact, emergencyMessage);
        if (result.success) {
          this.addLog('SMS', 'SENT', contact.name, contact.phone, `Delivered (${result.mode})`, emergencyMessage);
        } else {
          this.addLog('SMS', 'FAILED', contact.name, contact.phone, `Failed: ${result.error}`);
        }
      }
      soundManager.playDispatchSound();
    }

    // 4. Automatic Phone Call
    if (profile.callPriorityContact) {
      const priorityContact = contacts.find((c) => c.enabled && c.isPriority && (c.role === 'CALL' || c.role === 'BOTH')) ||
        contacts.find((c) => c.enabled && (c.role === 'CALL' || c.role === 'BOTH'));

      if (priorityContact) {
        if (profile.callTriggerDelaySeconds > 0) {
          this.addLog(
            'CALL',
            'PENDING',
            priorityContact.name,
            priorityContact.phone,
            `Waiting ${profile.callTriggerDelaySeconds}s delay before initiating priority call...`
          );
          await new Promise((r) => setTimeout(r, profile.callTriggerDelaySeconds * 1000));
        }

        this.addLog('CALL', 'PENDING', priorityContact.name, priorityContact.phone, 'Placing automated phone call...');
        const callResult = await CallService.makeCall(priorityContact);
        this.addLog('CALL', callResult.success ? 'SENT' : 'FAILED', priorityContact.name, priorityContact.phone, `Call placed (${callResult.mode})`);
      }
    }

    // 5. Evaluate Repeat Interval Logic
    this.handleRepeatSchedule(profile, contacts, userName);
  }

  /**
   * Handles repeating cycles or completes the session
   */
  private handleRepeatSchedule(profile: AlertProfile, contacts: Contact[], userName: string) {
    if (!this.currentSession) return;

    const isIndefinite = profile.maxRepeats === -1;
    const maxIter = profile.maxRepeats ?? (profile.isRepeatEnabled ? 5 : 1);
    const isRepeatActive = profile.isRepeatEnabled && (isIndefinite || maxIter > 1);
    const hasMoreRepeats = isRepeatActive && (isIndefinite || this.currentSession.currentIteration < maxIter);

    if (hasMoreRepeats) {
      this.currentSession.status = 'WAITING_REPEAT';
      this.currentSession.nextRepeatCountdown = profile.repeatIntervalSeconds;
      this.notify();

      this.addLog(
        'SYSTEM',
        'PENDING',
        undefined,
        undefined,
        `Iteration ${this.currentSession.currentIteration}/${isIndefinite ? '∞' : maxIter} finished.`,
        `Next repeat dispatch in ${profile.repeatIntervalSeconds} seconds.`
      );

      if (this.repeatTimer) clearInterval(this.repeatTimer);
      this.repeatTimer = window.setInterval(() => {
        if (!this.currentSession || this.currentSession.status !== 'WAITING_REPEAT') {
          if (this.repeatTimer) clearInterval(this.repeatTimer);
          return;
        }

        this.currentSession.nextRepeatCountdown -= 1;
        this.notify();

        if (this.currentSession.nextRepeatCountdown <= 0) {
          if (this.repeatTimer) clearInterval(this.repeatTimer);
          this.repeatTimer = null;
          this.currentSession.currentIteration += 1;
          // Re-dispatch with freshly fetched location
          this.finishCountdownAndDispatch(profile, contacts, userName);
        }
      }, 1000);
    } else {
      this.currentSession.status = 'COMPLETED';
      const count = this.currentSession.currentIteration;
      this.addLog(
        'SYSTEM',
        'SENT',
        undefined,
        undefined,
        `Emergency alert cycle completed (${count} alert cycle${count > 1 ? 's' : ''} sent).`
      );
      this.notify();
    }
  }

  /**
   * Cancels the active emergency session
   */
  public cancelAlert(reason = 'Cancelled by user') {
    soundManager.stopSiren();
    soundManager.playCancelSound();

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }

    if (this.currentSession) {
      this.currentSession.status = 'CANCELLED';
      this.addLog('SYSTEM', 'CANCELLED', undefined, undefined, reason);
      this.notify();
    }
  }

  /**
   * Resets session to IDLE
   */
  public dismissSession() {
    this.cancelAlert('Dismissed');
    this.currentSession = null;
    this.notify();
  }
}

export const emergencyPipeline = EmergencyPipeline.getInstance();
