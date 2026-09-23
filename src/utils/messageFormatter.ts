export interface TemplateVariables {
  name?: string;
  location?: string;
  time?: string;
  date?: string;
  battery?: string;
  coords?: { latitude: number; longitude: number };
}

/**
 * Replaces placeholders in the message template:
 * - /{location} or {location}: Google Maps live link or latitude/longitude
 * - /{time} or {time}: Current formatted time (e.g. 03:45 PM)
 * - /{date} or {date}: Current formatted date (e.g. 23 Sep 2026)
 * - /{name} or {name}: User name
 * - /{battery} or {battery}: Phone battery level
 */
export function formatEmergencyMessage(
  template: string,
  variables: TemplateVariables
): string {
  const now = new Date();
  const timeStr =
    variables.time ||
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr =
    variables.date ||
    now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  const locationStr = variables.location || 'Location unavailable';
  const nameStr = variables.name || 'EasiAlert User';
  const batteryStr = variables.battery || '85%';

  return template
    // Match both /{tag} and {tag} case-insensitively
    .replace(/\/\{location\}/gi, locationStr)
    .replace(/\{location\}/gi, locationStr)
    .replace(/\/\{time\}/gi, timeStr)
    .replace(/\{time\}/gi, timeStr)
    .replace(/\/\{date\}/gi, dateStr)
    .replace(/\{date\}/gi, dateStr)
    .replace(/\/\{name\}/gi, nameStr)
    .replace(/\{name\}/gi, nameStr)
    .replace(/\/\{battery\}/gi, batteryStr)
    .replace(/\{battery\}/gi, batteryStr);
}

/**
 * Builds standard Google Maps URL link from coordinates
 */
export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}
