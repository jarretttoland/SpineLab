import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.spinelab.mobile',
  appName: 'SpineLab',
  webDir: 'dist',

  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;