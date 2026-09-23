import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easisafity.app',
  appName: 'EasiAlert',
  webDir: 'dist',
  backgroundColor: '#0b0f19',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for EasiSafity IoT Hardware...',
        cancel: 'Cancel',
        availableDevices: 'Available Devices',
        noDeviceFound: 'No Devices Found',
      },
    },
  },
};

export default config;
