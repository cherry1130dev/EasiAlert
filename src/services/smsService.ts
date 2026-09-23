import type { Contact } from '../types/contact';

export interface SmsSendResult {
  success: boolean;
  contactName: string;
  phoneNumber: string;
  message: string;
  error?: string;
  mode: 'NATIVE' | 'SIMULATED';
}

declare global {
  interface Window {
    AndroidBridge?: {
      isNative: () => boolean;
      sendDirectSms: (phone: string, message: string) => boolean;
      openMessagingApp: (phone: string, message: string) => boolean;
      sendSmsAuto: (phone: string, message: string) => boolean;
      requestSmsAndContactsPermissions: () => void;
      hasSmsPermission: () => boolean;
      hasContactsPermission: () => boolean;
      pickContact: () => void;
      getPhonebookContacts: (limit: number) => string;
      openAppSettings?: () => void;
      checkPermissionsStatus?: () => string;
      requestAllPermissions?: () => void;
      hasAllPermissions?: () => boolean;
    };
    onNativeContactPicked?: (name: string, phone: string) => void;
    SMS?: {
      sendSMS: (
        address: string | string[],
        text: string,
        success: () => void,
        failure: (err: unknown) => void
      ) => void;
    };
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

export class SmsService {
  /**
   * Dispatches an SMS to a single contact.
   * Priority:
   * 1. AndroidBridge (Native Android SmsManager + Opens Messaging App)
   * 2. Cordova window.SMS / window.sms
   * 3. Web SMS intent: sms:phone?body=...
   * 4. Simulated fallback in browser
   */
  public static async sendSms(contact: Contact, message: string): Promise<SmsSendResult> {
    const cleanPhone = contact.phone.replace(/\s+/g, '');

    // 1. Primary: Native Android Bridge (Direct background SMS via SmsManager)
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      try {
        console.log(`[SmsService] Dispatching direct SMS via AndroidBridge to ${contact.name} (${cleanPhone})`);

        // Check/request SMS permission if needed
        if (typeof window.AndroidBridge.hasSmsPermission === 'function' && !window.AndroidBridge.hasSmsPermission()) {
          window.AndroidBridge.requestSmsAndContactsPermissions();
        }

        const sent = window.AndroidBridge.sendDirectSms(cleanPhone, message);
        if (sent) {
          return {
            success: true,
            contactName: contact.name,
            phoneNumber: cleanPhone,
            message,
            mode: 'NATIVE',
          };
        } else {
          console.warn('[SmsService] AndroidBridge sendDirectSms returned false');
        }
      } catch (bridgeErr) {
        console.warn('[SmsService] AndroidBridge error:', bridgeErr);
      }
    }

    // 2. Secondary: Cordova window.SMS.sendSMS (direct background SMS)
    if (typeof window !== 'undefined' && window.SMS && typeof window.SMS.sendSMS === 'function') {
      try {
        await new Promise<void>((resolve, reject) => {
          window.SMS?.sendSMS(
            cleanPhone,
            message,
            () => resolve(),
            (err) => reject(err)
          );
        });

        return {
          success: true,
          contactName: contact.name,
          phoneNumber: cleanPhone,
          message,
          mode: 'NATIVE',
        };
      } catch (cordovaErr) {
        console.warn('[SmsService] window.SMS error:', cordovaErr);
      }
    }

    // 3. Browser / Simulation Fallback
    console.log(`[SMS SIMULATION] To: ${contact.name} (${cleanPhone})\nContent: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      contactName: contact.name,
      phoneNumber: cleanPhone,
      message,
      mode: 'SIMULATED',
    };
  }

  /**
   * Explicitly opens the mobile messaging app prefilled with recipient and text
   */
  public static openMessagingApp(phone: string, message: string): boolean {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (typeof window !== 'undefined' && window.AndroidBridge?.openMessagingApp) {
      return window.AndroidBridge.openMessagingApp(cleanPhone, message);
    }
    if (typeof window !== 'undefined') {
      window.open(`sms:${cleanPhone}?body=${encodeURIComponent(message)}`, '_system');
      return true;
    }
    return false;
  }

  /**
   * Batch sends SMS to all contacts configured with role 'SMS' or 'BOTH'
   */
  public static async sendBatch(contacts: Contact[], message: string): Promise<SmsSendResult[]> {
    const eligible = contacts.filter((c) => c.enabled && (c.role === 'SMS' || c.role === 'BOTH'));
    const results: SmsSendResult[] = [];

    for (const contact of eligible) {
      const res = await this.sendSms(contact, message);
      results.push(res);
    }

    return results;
  }
}
