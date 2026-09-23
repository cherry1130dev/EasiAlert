package com.easisafity.app;

import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private NativeBridge nativeBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make app seamlessly match dark theme (#0b0f19) with white status bar icons
        applySystemBarsTheme();

        // Register Native JavaScript Bridge for direct SMS & Phonebook access
        try {
            nativeBridge = new NativeBridge(this);
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().addJavascriptInterface(nativeBridge, "AndroidBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Start Foreground Service to keep Bluetooth socket and emergency listener alive
        try {
            Intent serviceIntent = new Intent(this, EmergencyForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Check and prompt for permissions on startup
        checkAndPromptPermissions();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBarsTheme();
        checkAndPromptPermissions();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applySystemBarsTheme();
        }
    }

    /**
     * Seamlessly integrate edge-to-edge transparent status bar with white icons
     * over the app's dark background (#0b0f19).
     */
    private void applySystemBarsTheme() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();

            // 1. Enable edge-to-edge layout so app header flows underneath status bar
            WindowCompat.setDecorFitsSystemWindows(window, false);

            // 2. Make status bar and navigation bar completely transparent
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);

            // 3. Disable contrast enforcement on Android Q+ (prevents Android from injecting a white/grey scrim)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.setStatusBarContrastEnforced(false);
                window.setNavigationBarContrastEnforced(false);
            }

            // 4. Force white/light status bar icons (time, battery, network) against dark background
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
            if (insetsController != null) {
                insetsController.setAppearanceLightStatusBars(false); // false = white status icons
                insetsController.setAppearanceLightNavigationBars(false);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                View decor = window.getDecorView();
                int flags = decor.getSystemUiVisibility();
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                decor.setSystemUiVisibility(flags);
            }

            // 5. Ensure Window & WebView backgrounds are dark #0b0f19, avoiding any white flash
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.parseColor("#0b0f19")));
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().setBackgroundColor(Color.parseColor("#0b0f19"));
            }
        }
    }

    private void checkAndPromptPermissions() {
        try {
            java.util.ArrayList<String> missing = NativeBridge.getMissingPermissionsList(this);
            if (!missing.isEmpty()) {
                androidx.core.app.ActivityCompat.requestPermissions(
                    this,
                    missing.toArray(new String[0]),
                    NativeBridge.REQUEST_CODE_PERMISSIONS
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == NativeBridge.REQUEST_CODE_PICK_CONTACT && resultCode == RESULT_OK && data != null) {
            Uri contactUri = data.getData();
            if (contactUri != null) {
                try {
                    Cursor cursor = getContentResolver().query(contactUri, null, null, null, null);
                    if (cursor != null && cursor.moveToFirst()) {
                        int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                        int numIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                        String name = nameIdx >= 0 ? cursor.getString(nameIdx) : "Contact";
                        String number = numIdx >= 0 ? cursor.getString(numIdx) : "";
                        cursor.close();

                        if (number != null && !number.trim().isEmpty()) {
                            String cleanNumber = number.replaceAll("\\s+", "").replace("'", "\\'");
                            String cleanName = (name != null ? name : "Contact").replace("'", "\\'");
                            String js = String.format("if (window.onNativeContactPicked) { window.onNativeContactPicked('%s', '%s'); }", cleanName, cleanNumber);
                            if (this.bridge != null && this.bridge.getWebView() != null) {
                                this.bridge.getWebView().post(() -> this.bridge.getWebView().evaluateJavascript(js, null));
                            }
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
