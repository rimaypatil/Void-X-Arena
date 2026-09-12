export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    url?: string;
    androidScheme?: string;
    cleartext?: boolean;
    allowNavigation?: string[];
  };
  plugins?: Record<string, any>;
}

const isLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.voidxarena.app',
  appName: 'Void X Arena',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: false,
    ...(isLiveReload
      ? {
          url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000',
          cleartext: true,
        }
      : {}),
    allowNavigation: [
      'api.cashfree.com',
      'sandbox.cashfree.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#08080D',
      showSpinner: false,
      spinnerColor: '#7c3aed',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
    },
  },
};

export default config;
