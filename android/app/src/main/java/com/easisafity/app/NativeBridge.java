package com.easisafity.app;

import android.Manifest;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.telephony.SmsManager;
import android.util.Log;
import android.webkit.JavascriptInterface;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;

public class NativeBridge {
    private static final String TAG = "NativeBridge";
    public static final int REQUEST_CODE_PICK_CONTACT = 202;
    public static final int REQUEST_CODE_PERMISSIONS = 101;
    private final MainActivity activity;

    public NativeBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public boolean isNative() {
        return true;
    }

    public static String[] getRequiredPermissions() {
        ArrayList<String> perms = new ArrayList<>();
        perms.add(Manifest.permission.SEND_SMS);
        perms.add(Manifest.permission.READ_CONTACTS);
        perms.add(Manifest.permission.ACCESS_FINE_LOCATION);
        perms.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        perms.add(Manifest.permission.CALL_PHONE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            perms.add(Manifest.permission.BLUETOOTH_CONNECT);
            perms.add(Manifest.permission.BLUETOOTH_SCAN);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        return perms.toArray(new String[0]);
    }

    public static ArrayList<String> getMissingPermissionsList(android.content.Context context) {
        ArrayList<String> missing = new ArrayList<>();
        for (String perm : getRequiredPermissions()) {
            if (ContextCompat.checkSelfPermission(context, perm) != PackageManager.PERMISSION_GRANTED) {
                missing.add(perm);
            }
        }
        return missing;
    }

    @JavascriptInterface
    public void requestAllPermissions() {
        activity.runOnUiThread(() -> {
            ArrayList<String> missing = getMissingPermissionsList(activity);
            if (!missing.isEmpty()) {
                Log.i(TAG, "Requesting missing permissions: " + missing);
                ActivityCompat.requestPermissions(activity, missing.toArray(new String[0]), REQUEST_CODE_PERMISSIONS);
            } else {
                Log.i(TAG, "All permissions already granted!");
            }
        });
    }

    @JavascriptInterface
    public void requestSmsAndContactsPermissions() {
        requestAllPermissions();
    }

    @JavascriptInterface
    public boolean hasAllPermissions() {
        return getMissingPermissionsList(activity).isEmpty();
    }

    @JavascriptInterface
    public String checkPermissionsStatus() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("sms", ContextCompat.checkSelfPermission(activity, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED);
            obj.put("contacts", ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED);
            obj.put("location", ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED);
            obj.put("phone", ContextCompat.checkSelfPermission(activity, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED);

            boolean btGranted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                btGranted = ContextCompat.checkSelfPermission(activity, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED &&
                            ContextCompat.checkSelfPermission(activity, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;
            }
            obj.put("bluetooth", btGranted);

            boolean notifGranted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                notifGranted = ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            }
            obj.put("notifications", notifGranted);
            obj.put("allGranted", hasAllPermissions());

            return obj.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public boolean hasSmsPermission() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public boolean hasContactsPermission() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public boolean sendDirectSms(String phone, String message) {
        try {
            if (phone == null || phone.trim().isEmpty()) {
                Log.w(TAG, "sendDirectSms: empty phone number");
                return false;
            }

            final String cleanPhone = phone.replaceAll("[^0-9+]", "");
            if (cleanPhone.isEmpty()) {
                Log.w(TAG, "sendDirectSms: phone number has no digits");
                return false;
            }

            if (!hasSmsPermission()) {
                Log.w(TAG, "sendDirectSms: SEND_SMS permission NOT granted, requesting permissions now");
                requestAllPermissions();
                return false;
            }

            SmsManager smsManager = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try {
                    smsManager = activity.getSystemService(SmsManager.class);
                } catch (Exception e) {
                    Log.w(TAG, "Could not get SmsManager via getSystemService: " + e.getMessage());
                }
            }
            if (smsManager == null) {
                smsManager = SmsManager.getDefault();
            }

            if (smsManager == null) {
                Log.e(TAG, "SmsManager not available on this device");
                return false;
            }

            ArrayList<String> parts = smsManager.divideMessage(message);
            if (parts.size() <= 1) {
                smsManager.sendTextMessage(cleanPhone, null, message, null, null);
            } else {
                smsManager.sendMultipartTextMessage(cleanPhone, null, parts, null, null);
            }

            Log.i(TAG, "sendDirectSms: successfully dispatched direct SMS to " + cleanPhone);

            // Show Toast notification to reassure user that SMS was sent directly in background
            activity.runOnUiThread(() -> {
                try {
                    android.widget.Toast.makeText(
                        activity,
                        "EasiAlert: Emergency SMS automatically sent to " + cleanPhone,
                        android.widget.Toast.LENGTH_LONG
                    ).show();
                } catch (Exception ignored) {}
            });

            return true;
        } catch (Exception e) {
            Log.e(TAG, "sendDirectSms exception: " + e.getMessage(), e);
            return false;
        }
    }

    @JavascriptInterface
    public boolean openMessagingApp(String phone, String message) {
        try {
            activity.runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_SENDTO);
                    intent.setData(Uri.parse("smsto:" + Uri.encode(phone)));
                    intent.putExtra("sms_body", message);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(intent);
                    Log.i(TAG, "openMessagingApp: launched SMS app for " + phone);
                } catch (Exception e) {
                    Log.w(TAG, "openMessagingApp intent failed, trying generic fallback: " + e.getMessage());
                    try {
                        Intent fallback = new Intent(Intent.ACTION_VIEW);
                        fallback.setType("vnd.android-dir/mms-sms");
                        fallback.putExtra("address", phone);
                        fallback.putExtra("sms_body", message);
                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        activity.startActivity(fallback);
                    } catch (Exception ex) {
                        Log.e(TAG, "Failed to launch SMS intent: " + ex.getMessage(), ex);
                    }
                }
            });
            return true;
        } catch (Exception e) {
            Log.e(TAG, "openMessagingApp error: " + e.getMessage(), e);
            return false;
        }
    }

    /**
     * Automatic emergency trigger: sends SMS directly in the background WITHOUT
     * redirecting to the SMS messaging app or forcing the user to press Send!
     */
    @JavascriptInterface
    public boolean sendSmsAuto(String phone, String message) {
        return sendDirectSms(phone, message);
    }

    @JavascriptInterface
    public void openAppSettings() {
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", activity.getPackageName(), null);
                intent.setData(uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to open app settings: " + e.getMessage(), e);
            }
        });
    }

    @JavascriptInterface
    public void pickContact() {
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
                activity.startActivityForResult(intent, REQUEST_CODE_PICK_CONTACT);
            } catch (Exception e) {
                Log.e(TAG, "pickContact failed: " + e.getMessage(), e);
            }
        });
    }

    @JavascriptInterface
    public String getPhonebookContacts(int limit) {
        JSONArray contactsArray = new JSONArray();
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            requestSmsAndContactsPermissions();
            return contactsArray.toString();
        }

        try {
            ContentResolver resolver = activity.getContentResolver();
            Cursor cursor = resolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor != null) {
                int count = 0;
                int max = limit > 0 ? limit : 200;
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                while (cursor.moveToNext() && count < max) {
                    String name = nameIndex >= 0 ? cursor.getString(nameIndex) : "";
                    String number = numberIndex >= 0 ? cursor.getString(numberIndex) : "";

                    if (number != null && !number.trim().isEmpty()) {
                        JSONObject contact = new JSONObject();
                        contact.put("name", name != null && !name.trim().isEmpty() ? name : "Contact");
                        contact.put("phone", number.replaceAll("\\s+", ""));
                        contactsArray.put(contact);
                        count++;
                    }
                }
                cursor.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "getPhonebookContacts query failed: " + e.getMessage(), e);
        }

        return contactsArray.toString();
    }
}
