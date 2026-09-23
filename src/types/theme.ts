export type AppThemeId =
  | 'SOS'
  | 'WOMEN_SAFETY'
  | 'CHILD_SAFETY'
  | 'ELDER_SAFETY'
  | 'PATIENT_MONITORING'
  | 'ACCIDENT_DETECTION'
  | 'OBJECT_DETECTION'
  | 'CUSTOM';

export interface AppTheme {
  id: AppThemeId;
  name: string;
  tagline: string;
  primaryColor: string;
  glowColor: string;
  gradient: string;
  badgeBg: string;
  badgeColor: string;
  borderAccent: string;
  defaultTemplate: string;
}

export const APP_THEMES: Record<AppThemeId, AppTheme> = {
  SOS: {
    id: 'SOS',
    name: 'SOS Emergency',
    tagline: 'High-visibility rapid distress alert',
    primaryColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeColor: '#f87171',
    borderAccent: 'rgba(239, 68, 68, 0.4)',
    defaultTemplate: "Alert! Emergency, I need help at /{location} at /{time}, /{date}",
  },
  WOMEN_SAFETY: {
    id: 'WOMEN_SAFETY',
    name: "Women's Safety",
    tagline: 'Discreet and rapid personal protection',
    primaryColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    gradient: 'linear-gradient(135deg, #db2777 0%, #a855f7 100%)',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeColor: '#f472b6',
    borderAccent: 'rgba(236, 72, 153, 0.4)',
    defaultTemplate: "URGENT SOS (Women Safety): I feel unsafe. Track my live location at /{location} at /{time}, /{date}. Please check on me!",
  },
  CHILD_SAFETY: {
    id: 'CHILD_SAFETY',
    name: 'Child Safety',
    tagline: 'Kids wearable & student tracking shield',
    primaryColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeColor: '#22d3ee',
    borderAccent: 'rgba(6, 182, 212, 0.4)',
    defaultTemplate: "CHILD ALERT: Child trigger activated at /{location} on /{date} at /{time}. Please attend immediately!",
  },
  ELDER_SAFETY: {
    id: 'ELDER_SAFETY',
    name: 'Elder Safety',
    tagline: 'Senior citizen fall and health assistance',
    primaryColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeColor: '#fbbf24',
    borderAccent: 'rgba(245, 158, 11, 0.4)',
    defaultTemplate: "ELDER ASSIST: Senior citizen needs help at /{location} (Recorded at /{time}, /{date}). Please call or visit immediately.",
  },
  PATIENT_MONITORING: {
    id: 'PATIENT_MONITORING',
    name: 'Patient Monitoring',
    tagline: 'Hospital and home healthcare distress link',
    primaryColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#34d399',
    borderAccent: 'rgba(16, 185, 129, 0.4)',
    defaultTemplate: "MEDICAL ALERT: Patient requires immediate assistance at /{location} on /{date} at /{time}.",
  },
  ACCIDENT_DETECTION: {
    id: 'ACCIDENT_DETECTION',
    name: 'Accident Detection',
    tagline: 'Crash, collision and impact detection',
    primaryColor: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.45)',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
    badgeBg: 'rgba(234, 88, 12, 0.15)',
    badgeColor: '#fb923c',
    borderAccent: 'rgba(234, 88, 12, 0.4)',
    defaultTemplate: "CRITICAL CRASH ALERT: Impact/accident detected at /{location} at /{time}, /{date}. Immediate emergency rescue required!",
  },
  OBJECT_DETECTION: {
    id: 'OBJECT_DETECTION',
    name: 'Object Detection',
    tagline: 'Asset security, anti-theft and motion alert',
    primaryColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    badgeColor: '#a78bfa',
    borderAccent: 'rgba(139, 92, 246, 0.4)',
    defaultTemplate: "SECURITY ALERT: Monitored asset movement/tampering detected at /{location} at /{time}, /{date}.",
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Theme',
    tagline: 'Personalized colors & custom alert parameters',
    primaryColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeColor: '#7dd3fc',
    borderAccent: 'rgba(56, 189, 248, 0.4)',
    defaultTemplate: "CUSTOM ALERT: Emergency assistance required at /{location} on /{date} at /{time}.",
  },
};

/**
 * Generates an AppTheme object dynamically from a user-selected primary color
 */
export function buildCustomTheme(colorHex: string, customName?: string, customTemplate?: string): AppTheme {
  const hex = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
  
  // Convert hex to rgb for glow / alpha variants
  let r = 56, g = 189, b = 248;
  if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    const clean = hex.replace('#', '');
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }

  return {
    id: 'CUSTOM',
    name: customName?.trim() || 'Custom Theme',
    tagline: 'User-customized dynamic theme',
    primaryColor: hex,
    glowColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
    gradient: `linear-gradient(135deg, rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 1) 0%, ${hex} 100%)`,
    badgeBg: `rgba(${r}, ${g}, ${b}, 0.18)`,
    badgeColor: hex,
    borderAccent: `rgba(${r}, ${g}, ${b}, 0.5)`,
    defaultTemplate: customTemplate || "CUSTOM ALERT: Emergency assistance required at /{location} on /{date} at /{time}.",
  };
}
