import { Geolocation } from '@capacitor/geolocation';
import type { GeoLocationCoords } from '../types/emergency';
import { buildGoogleMapsUrl } from '../utils/messageFormatter';

const STORAGE_KEY_LAST_KNOWN = 'easisafity_last_known_location';

export class LocationService {
  private static cachedCoords: GeoLocationCoords | null = null;
  private static mockOverrideCoords: GeoLocationCoords | null = null;

  static {
    // Load previously cached coordinates on initialization
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_KNOWN);
      if (stored) {
        this.cachedCoords = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load cached location:', e);
    }
  }

  /**
   * Set custom coordinates for testing / simulation
   */
  public static setMockCoordinates(coords: GeoLocationCoords | null) {
    this.mockOverrideCoords = coords;
  }

  /**
   * Returns the last known persistent coordinates if available
   */
  public static getLastKnownLocation(): GeoLocationCoords | null {
    if (this.cachedCoords) return this.cachedCoords;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_KNOWN);
      if (stored) {
        this.cachedCoords = JSON.parse(stored);
        return this.cachedCoords;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Fetches the current location with High Accuracy.
   * If GPS is available: updates default/cached location with current location.
   * If GPS is not available/fails: uses previous location coordinates as default.
   */
  public static async getCurrentLocation(): Promise<{
    coords: GeoLocationCoords;
    mapsUrl: string;
    isSimulated: boolean;
    isLastKnown: boolean;
  }> {
    if (this.mockOverrideCoords) {
      const mapsUrl = buildGoogleMapsUrl(this.mockOverrideCoords.latitude, this.mockOverrideCoords.longitude);
      return { coords: this.mockOverrideCoords, mapsUrl, isSimulated: true, isLastKnown: false };
    }

    // 1. Try Native Capacitor Geolocation first for faster & more accurate device GPS
    try {
      const capPos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      });

      if (capPos && capPos.coords) {
        const coords: GeoLocationCoords = {
          latitude: capPos.coords.latitude,
          longitude: capPos.coords.longitude,
          accuracy: capPos.coords.accuracy,
          timestamp: capPos.timestamp,
        };

        // Update default / cached location with fresh location
        this.saveLocation(coords);
        const mapsUrl = buildGoogleMapsUrl(coords.latitude, coords.longitude);
        return { coords, mapsUrl, isSimulated: false, isLastKnown: false };
      }
    } catch (capErr) {
      console.warn('Capacitor Geolocation error, trying navigator.geolocation...', capErr);
    }

    // 2. Try browser / webview navigator.geolocation
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 10000,
          });
        });

        const coords: GeoLocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        // Update default / cached location with fresh location
        this.saveLocation(coords);
        const mapsUrl = buildGoogleMapsUrl(coords.latitude, coords.longitude);
        return { coords, mapsUrl, isSimulated: false, isLastKnown: false };
      } catch (err) {
        console.warn('GPS location request failed or timed out. Falling back to previous known location.', err);
      }
    }

    // 3. Fallback: Use previous location coordinates as default
    const lastKnown = this.getLastKnownLocation();
    if (lastKnown) {
      const mapsUrl = buildGoogleMapsUrl(lastKnown.latitude, lastKnown.longitude);
      return { coords: lastKnown, mapsUrl, isSimulated: false, isLastKnown: true };
    }

    // 4. Default baseline fallback if never acquired before
    const defaultCoords: GeoLocationCoords = {
      latitude: 17.385044, // Default City Coordinates (e.g. Hyderabad)
      longitude: 78.486671,
      accuracy: 50,
      timestamp: Date.now(),
    };

    const mapsUrl = buildGoogleMapsUrl(defaultCoords.latitude, defaultCoords.longitude);
    return { coords: defaultCoords, mapsUrl, isSimulated: true, isLastKnown: false };
  }

  private static saveLocation(coords: GeoLocationCoords) {
    this.cachedCoords = coords;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_KNOWN, JSON.stringify(coords));
    } catch (e) {
      console.warn('Could not save location to localStorage:', e);
    }
  }
}
