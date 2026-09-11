'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Settings,
  ShieldAlert,
  Smartphone,
  Megaphone,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<'APP_SETTINGS' | 'BANNERS'>('APP_SETTINGS');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // App Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Void X Arena is undergoing scheduled system upgrades. Battles resume shortly!'
  );
  const [minAppVersion, setMinAppVersion] = useState('1.0.0');
  const [latestAppVersion, setLatestAppVersion] = useState('1.1.0');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    'Season 4 Grand Championship Registrations are LIVE. Grab your squad slots!'
  );

  // Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    ctaText: string;
    imageUrl: string;
    linkUrl: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    title: '',
    subtitle: '',
    badge: '',
    ctaText: '',
    imageUrl: '',
    linkUrl: '',
    displayOrder: 1,
    isActive: true,
  });
  const [submittingBanner, setSubmittingBanner] = useState(false);

  // Fetch Settings & Banners
  const fetchData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, bannersRes] = await Promise.all([
        fetch('/api/v1/admin/settings', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/v1/admin/banners', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const settingsJson = await settingsRes.json();
      const bannersJson = await bannersRes.json();

      if (settingsJson.success && settingsJson.data) {
        const s = settingsJson.data;
        if (s.maintenance_mode !== undefined) {
          setMaintenanceMode(Boolean(s.maintenance_mode.enabled));
          if (s.maintenance_mode.message) setMaintenanceMessage(s.maintenance_mode.message);
        }
        if (s.app_version !== undefined) {
          if (s.app_version.minVersion) setMinAppVersion(s.app_version.minVersion);
          if (s.app_version.latestVersion) setLatestAppVersion(s.app_version.latestVersion);
          if (s.app_version.forceUpdate !== undefined) setForceUpdate(Boolean(s.app_version.forceUpdate));
        }
        if (s.announcement !== undefined) {
          if (s.announcement.enabled !== undefined) setAnnouncementActive(Boolean(s.announcement.enabled));
          if (s.announcement.message) setAnnouncementText(s.announcement.message);
        }
      }

      if (bannersJson.success && Array.isArray(bannersJson.data)) {
        setBanners(bannersJson.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  // Save System Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSavingSettings(true);
    setError(null);
    setSuccess(null);

    try {
      // Save maintenance mode
      await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          key: 'maintenance_mode',
          value: {
            enabled: maintenanceMode,
            message: maintenanceMessage,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      // Save app version
      await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          key: 'app_version',
          value: {
            minVersion: minAppVersion,
            latestVersion: latestAppVersion,
            forceUpdate,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      // Save announcement
      await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          key: 'announcement',
          value: {
            enabled: announcementActive,
            message: announcementText,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      setSuccess('Operational settings synchronized successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Banner CRUD
  const handleOpenCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      badge: 'SEASON 1 REGISTRATION',
      ctaText: 'Enter Arena',
      imageUrl: '/assets/images/freefire/esports.jpg',
      linkUrl: '/arena',
      displayOrder: banners.length + 1,
      isActive: true,
    });
    setShowBannerModal(true);
  };

  const handleOpenEditBanner = (b: any) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      badge: b.badge || '',
      ctaText: b.ctaText || '',
      imageUrl: b.imageUrl || '',
      linkUrl: b.linkUrl || '',
      displayOrder: b.displayOrder ?? 1,
      isActive: b.isActive ?? true,
    });
    setShowBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSubmittingBanner(true);
    try {
      if (editingBanner) {
        // Update
        const res = await fetch(`/api/v1/admin/banners/${editingBanner.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(bannerForm),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Update failed');
      } else {
        // Create
        const res = await fetch('/api/v1/admin/banners', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(bannerForm),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Creation failed');
      }

      setShowBannerModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to permanently delete banner "${title}"?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      } else {
        alert(json.error?.message || 'Failed to delete banner');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleBannerActive = async (banner: any) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/v1/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-purple-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            System Operations & Configuration
          </h1>
          <p className="text-xs text-void-400 mt-1">
            Global emergency switches, client version locks, and database-driven promotional hero banners.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-void-950 border border-void-700 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('APP_SETTINGS')}
            className={`px-4 py-2 text-xs font-display font-bold uppercase rounded-lg transition-all ${
              activeTab === 'APP_SETTINGS'
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            App Control
          </button>
          <button
            onClick={() => setActiveTab('BANNERS')}
            className={`px-4 py-2 text-xs font-display font-bold uppercase rounded-lg transition-all ${
              activeTab === 'BANNERS'
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            Promotional Banners ({banners.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl text-status-success text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab: APP SETTINGS */}
      {activeTab === 'APP_SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Maintenance Mode Lockout */}
          <div className="bg-void-900 border border-void-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-void-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-status-warning" />
                <div>
                  <h2 className="text-sm font-display font-bold uppercase text-void-100">
                    Platform Maintenance Mode
                  </h2>
                  <p className="text-xs text-void-400 mt-0.5">
                    Locks contender public endpoints and displays the maintenance splash screen across mobile & web.
                  </p>
                </div>
              </div>

              {/* Maintenance Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-void-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-void-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-error"></div>
              </label>
            </div>

            {maintenanceMode && (
              <div className="p-3.5 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>WARNING: Maintenance Mode is currently ARMED. Public access to tournament queues is blocked.</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Contender Maintenance Notice
              </label>
              <textarea
                rows={2}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors"
                placeholder="Enter maintenance banner message for players..."
              />
            </div>
          </div>

          {/* Version Enforcement */}
          <div className="bg-void-900 border border-void-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-void-800 pb-3">
              <Smartphone className="w-5 h-5 text-purple-bright" />
              <div>
                <h2 className="text-sm font-display font-bold uppercase text-void-100">
                  Android APK & Client Versioning
                </h2>
                <p className="text-xs text-void-400 mt-0.5">
                  Protects competition integrity by ensuring all contenders run compliant client builds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Minimum Supported Version
                </label>
                <input
                  type="text"
                  required
                  value={minAppVersion}
                  onChange={(e) => setMinAppVersion(e.target.value)}
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors"
                  placeholder="e.g. 1.0.0"
                />
                <span className="text-[10px] text-void-500 mt-1 block">
                  Builds below this will be blocked until updated.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Latest Production Version
                </label>
                <input
                  type="text"
                  required
                  value={latestAppVersion}
                  onChange={(e) => setLatestAppVersion(e.target.value)}
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors"
                  placeholder="e.g. 1.2.0"
                />
                <span className="text-[10px] text-void-500 mt-1 block">
                  Broadcasts optional update prompts to users.
                </span>
              </div>

              <div className="flex flex-col justify-between">
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Hard Force Update Flag
                </label>
                <div className="flex items-center gap-3 h-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceUpdate}
                      onChange={(e) => setForceUpdate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-void-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-void-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-brand"></div>
                  </label>
                  <span className="text-xs font-mono text-void-300">
                    {forceUpdate ? 'Enforced Hard Lock' : 'Soft Prompt'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Global Broadcast Announcement */}
          <div className="bg-void-900 border border-void-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-void-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-status-success" />
                <div>
                  <h2 className="text-sm font-display font-bold uppercase text-void-100">
                    Global In-App Announcement Ticker
                  </h2>
                  <p className="text-xs text-void-400 mt-0.5">
                    Displays high-priority ticker banner at the top of the Arena dashboard.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-void-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-void-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-brand"></div>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Announcement Message
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors"
                placeholder="Broadcast headline..."
              />
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={savingSettings}
              icon={savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {savingSettings ? 'Synchronizing State...' : 'Save System Settings'}
            </Button>
          </div>
        </form>
      )}

      {/* Tab: BANNERS */}
      {activeTab === 'BANNERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-void-400">
              Promotional hero carousels rendered on the home and tournament exploration pages.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateBanner}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Banner Asset
            </Button>
          </div>

          {banners.length === 0 ? (
            <div className="text-center py-16 bg-void-900 border border-void-700 rounded-2xl">
              <ImageIcon className="w-12 h-12 text-void-600 mx-auto mb-3" />
              <p className="text-sm text-void-300 font-display font-bold uppercase">No Promotional Banners Found</p>
              <p className="text-xs text-void-500 mt-1">Create your first database-driven banner above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className={`bg-void-900 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                    b.isActive ? 'border-void-700 hover:border-void-600' : 'border-void-800 opacity-60'
                  }`}
                >
                  <div>
                    {/* Banner Image Preview */}
                    <div className="relative h-40 w-full bg-void-950 overflow-hidden border-b border-void-800">
                      <img
                        src={b.imageUrl}
                        alt={b.title}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src = '/assets/images/freefire/battle-royale.jpg';
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase border ${
                            b.isActive
                              ? 'bg-status-success/20 text-status-success border-status-success/40'
                              : 'bg-void-800 text-void-400 border-void-700'
                          }`}
                        >
                          {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-void-950/80 text-void-300 border border-void-700">
                          Order: {b.displayOrder}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-display font-bold text-void-100 uppercase tracking-tight">
                        {b.title}
                      </h3>
                      {b.linkUrl && (
                        <div className="flex items-center gap-1.5 text-xs text-purple-bright font-mono">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate">{b.linkUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 bg-void-950/60 border-t border-void-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleBannerActive(b)}
                      className="flex items-center gap-1.5 text-xs font-display font-bold uppercase text-void-300 hover:text-void-100 transition-colors"
                    >
                      {b.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-status-success" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-void-500" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditBanner(b)}
                        className="p-1.5 text-void-400 hover:text-void-100 hover:bg-void-850 rounded-lg transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id, b.title)}
                        className="p-1.5 text-void-400 hover:text-status-error hover:bg-void-850 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banner Create/Edit Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-void-900 border border-void-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-display font-black text-void-100 uppercase tracking-tight">
              {editingBanner ? 'Edit Promotional Banner' : 'Create Hero Banner Asset'}
            </h2>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Banner Headline *
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g. Free Fire India Championship Season 5"
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g. Automated custom rooms, instant slot locking, and verified payouts."
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                    Badge / Tag Label
                  </label>
                  <input
                    type="text"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    placeholder="e.g. SEASON 1 REGISTRATION"
                    className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    placeholder="e.g. Enter Arena"
                    className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Image URL / Asset Path *
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  placeholder="/assets/images/freefire/esports.jpg"
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                  Destination Target Link (Optional)
                </label>
                <input
                  type="text"
                  value={bannerForm.linkUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                  placeholder="e.g. /arena or /arena/wallet or /arena/results"
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                    Display Sequence Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bannerForm.displayOrder}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, displayOrder: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none"
                  />
                </div>

                <div className="flex flex-col justify-between">
                  <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                    Banner Status
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bannerForm.isActive}
                        onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-void-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-void-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-brand"></div>
                    </label>
                    <span className="text-xs font-mono text-void-300">
                      {bannerForm.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-void-800">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 rounded-xl border border-void-700 text-void-400 hover:text-void-200 text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingBanner}
                  icon={submittingBanner ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                >
                  {submittingBanner ? 'Saving...' : 'Save Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
