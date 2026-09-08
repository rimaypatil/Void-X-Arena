'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SystemStatusData {
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
  };
  versioning: {
    minAppVersion: string;
    latestAppVersion: string;
    requiresUpdate: boolean;
    optionalUpdateAvailable: boolean;
    apkDownloadUrl: string;
  };
}

export const SystemOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/v1/system/status', {
        headers: { 'x-app-version': '1.0.0' },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data);
      }
    } catch {
      // Continue if network fails on first check
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // 1. Maintenance Mode Active
  if (status?.maintenance?.enabled) {
    return (
      <div className="min-h-screen bg-void-999 flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-void-900 border border-purple-brand/50 shadow-purple-md text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-purple-brand/20 border border-purple-brand/50 flex items-center justify-center text-purple-bright mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-lg sm:text-xl text-void-100 uppercase tracking-tight">
            {status.maintenance.title}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-void-300 leading-relaxed">
            {status.maintenance.message}
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              icon={<RefreshCw className="w-4 h-4" />}
              className="w-full"
            >
              Check Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mandatory Force Update Required
  if (status?.versioning?.requiresUpdate) {
    return (
      <div className="min-h-screen bg-void-999 flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-void-900 border border-status-warning/50 shadow-card-dark text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-status-warning/20 border border-status-warning/50 flex items-center justify-center text-status-warning mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-lg sm:text-xl text-void-100 uppercase tracking-tight">
            Update Required
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-void-300 leading-relaxed">
            A critical new version of the Void X Arena client is required to access official matches and wallet operations.
          </p>
          <div className="mt-6">
            <Button
              asAnchor
              href={status.versioning.apkDownloadUrl}
              variant="primary"
              size="md"
              icon={<Download className="w-4 h-4" />}
              className="w-full"
            >
              Download Latest APK
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
