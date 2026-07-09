import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.srdr.budgettracker',
  appName: 'Cüzdan',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
