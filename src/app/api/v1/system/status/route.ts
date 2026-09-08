import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    let settingsValue: any = null;

    try {
      const setting = await prisma.appSetting.findUnique({
        where: { key: 'system_status' },
      });
      if (setting && typeof setting.value === 'object') {
        settingsValue = setting.value;
      }
    } catch {
      // Fallback to environment configuration if database is warming up
    }

    const maintenanceMode = settingsValue?.maintenanceMode ?? (process.env.MAINTENANCE_MODE === 'true');
    const maintenanceTitle = settingsValue?.maintenanceTitle || 'Under Maintenance';
    const maintenanceMessage = settingsValue?.maintenanceMessage || (process.env.MAINTENANCE_MESSAGE || 'Void X Arena servers are currently undergoing maintenance.');
    const minAppVersion = settingsValue?.minAppVersion || (process.env.MIN_SUPPORTED_APP_VERSION || '1.0.0');
    const latestAppVersion = settingsValue?.latestAppVersion || (process.env.APP_VERSION || '1.0.0');
    const forceUpdate = settingsValue?.forceUpdate ?? false;
    const apkDownloadUrl = settingsValue?.apkDownloadUrl || (process.env.NEXT_PUBLIC_ANDROID_APK_URL || 'https://voidxarena.gg/downloads/voidxarena-v1.0.apk');

    // Parse client version from header if provided (e.g. 'x-app-version')
    const clientVersion = request.headers.get('x-app-version');
    let requiresUpdate = false;
    let optionalUpdateAvailable = false;

    if (clientVersion) {
      if (clientVersion < minAppVersion) {
        requiresUpdate = true;
      } else if (clientVersion < latestAppVersion) {
        optionalUpdateAvailable = true;
      }
    }

    return Api.success({
      serverTime: new Date().toISOString(),
      maintenance: {
        enabled: maintenanceMode,
        title: maintenanceTitle,
        message: maintenanceMessage,
      },
      versioning: {
        currentVersion: clientVersion || null,
        minAppVersion,
        latestAppVersion,
        requiresUpdate,
        optionalUpdateAvailable,
        forceUpdate,
        apkDownloadUrl,
      },
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch system status', error.message);
  }
}
