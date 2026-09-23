export type AlertPresetType = 'PERSONAL' | 'WOMEN_SAFETY' | 'ACCIDENT_DETECT' | 'CUSTOM';

export interface AlertProfile {
  id: string;
  presetType: AlertPresetType;
  presetName: string;
  description: string;
  gracePeriodSeconds: number; // Abort countdown window (e.g. 10s)
  isRepeatEnabled: boolean;
  repeatIntervalSeconds: number; // Time between repeats (e.g. 60s)
  maxRepeats: number; // e.g. 5 repeats, or -1 for indefinite until user stops
  messageTemplate: string;
  callPriorityContact: boolean;
  callTriggerDelaySeconds: number; // Delay in seconds after SMS before placing call
  soundAlarmOnPhone: boolean; // Play phone audio siren during countdown
}

export const ALERT_PRESETS: Record<AlertPresetType, AlertProfile> = {
  PERSONAL: {
    id: 'p_personal',
    presetType: 'PERSONAL',
    presetName: 'Personal Emergency Button',
    description: 'General panic alert for elderly, medical emergencies, or distress situations.',
    gracePeriodSeconds: 10,
    isRepeatEnabled: true,
    repeatIntervalSeconds: 60,
    maxRepeats: 5,
    messageTemplate: 'EMERGENCY: I need urgent help! My current location: {location} (Triggered at {time}). Please call me or send help immediately.',
    callPriorityContact: true,
    callTriggerDelaySeconds: 3,
    soundAlarmOnPhone: true,
  },
  WOMEN_SAFETY: {
    id: 'p_women',
    presetType: 'WOMEN_SAFETY',
    presetName: "Women's Safety Wearable",
    description: 'Discreet or panic trigger for commute safety with rapid location tracking updates.',
    gracePeriodSeconds: 5,
    isRepeatEnabled: true,
    repeatIntervalSeconds: 45,
    maxRepeats: 10,
    messageTemplate: 'URGENT SOS (EasiAlert): I feel unsafe and triggered an alert. Track my live location here: {location} at {time}. Please check on me!',
    callPriorityContact: true,
    callTriggerDelaySeconds: 2,
    soundAlarmOnPhone: false, // Silent on phone to protect the user from assailant
  },
  ACCIDENT_DETECT: {
    id: 'p_accident',
    presetType: 'ACCIDENT_DETECT',
    presetName: 'Accident Detection (Car / Bike)',
    description: 'Automatic shock/impact detection with grace period to cancel false alarms.',
    gracePeriodSeconds: 15,
    isRepeatEnabled: true,
    repeatIntervalSeconds: 90,
    maxRepeats: 6,
    messageTemplate: 'CRITICAL ALERT: Vehicle crash/impact detected for {name}! Location: {location} recorded at {time}. Immediate medical/rescue assistance requested.',
    callPriorityContact: true,
    callTriggerDelaySeconds: 5,
    soundAlarmOnPhone: true,
  },
  CUSTOM: {
    id: 'p_custom',
    presetType: 'CUSTOM',
    presetName: 'Custom Profile',
    description: 'Fully personalized emergency alert configuration.',
    gracePeriodSeconds: 10,
    isRepeatEnabled: false,
    repeatIntervalSeconds: 60,
    maxRepeats: 1,
    messageTemplate: 'EasiAlert from {name}: Emergency assistance needed at {location} ({time}).',
    callPriorityContact: false,
    callTriggerDelaySeconds: 0,
    soundAlarmOnPhone: true,
  },
};
