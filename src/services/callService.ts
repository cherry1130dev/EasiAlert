import type { Contact } from '../types/contact';

export interface CallResult {
  success: boolean;
  contactName: string;
  phoneNumber: string;
  mode: 'NATIVE' | 'SIMULATED';
  error?: string;
}

declare global {
  interface Window {
    plugins?: {
      CallNumber?: {
        callNumber: (
          success: (res: unknown) => void,
          error: (err: unknown) => void,
          number: string,
          bypassAppChooser: boolean
        ) => void;
      };
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export class CallService {
  /**
   * Triggers an automated phone call to the target contact.
   * On Android:
   * - Uses @capacitor-community/call-number with bypassAppChooser: true (requires CALL_PHONE permission)
   * - Falls back to window.location.href = `tel:${phone}`
   * In Web Browser:
   * - Logs and simulates dialer invocation
   */
  public static async makeCall(contact: Contact): Promise<CallResult> {
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

    if (isNative) {
      try {
        if (window.plugins?.CallNumber?.callNumber) {
          await new Promise<void>((resolve, reject) => {
            window.plugins?.CallNumber?.callNumber(
              () => resolve(),
              (err) => reject(err),
              contact.phone,
              true // bypassAppChooser: direct call without prompt
            );
          });

          return {
            success: true,
            contactName: contact.name,
            phoneNumber: contact.phone,
            mode: 'NATIVE',
          };
        }

        // Fallback: tel URI
        window.location.href = `tel:${contact.phone}`;
        return {
          success: true,
          contactName: contact.name,
          phoneNumber: contact.phone,
          mode: 'NATIVE',
        };
      } catch (err) {
        console.error(`Native Call trigger failed for ${contact.name}:`, err);
        return {
          success: false,
          contactName: contact.name,
          phoneNumber: contact.phone,
          mode: 'NATIVE',
          error: String(err),
        };
      }
    }

    // Web simulation mode
    console.log(`[CALL SIMULATION] Dialing Priority Contact: ${contact.name} (${contact.phone})`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      contactName: contact.name,
      phoneNumber: contact.phone,
      mode: 'SIMULATED',
    };
  }
}
