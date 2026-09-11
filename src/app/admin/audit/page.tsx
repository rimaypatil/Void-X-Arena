'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Code,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AdminAuditLogsPage() {
  const { accessToken } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspection Modal
  const [inspectLog, setInspectLog] = useState<any | null>(null);

  const fetchAuditLogs = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });
      if (selectedAction !== 'ALL') query.append('action', selectedAction);
      if (selectedEntityType !== 'ALL') query.append('entityType', selectedEntityType);

      const res = await fetch(`/api/v1/admin/audit-logs?${query.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.logs);
        setTotalPages(json.data.pagination.totalPages || 1);
        setTotalCount(json.data.pagination.total || 0);
      } else {
        setError(json.error?.message || 'Failed to fetch audit records.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [accessToken, page, selectedAction, selectedEntityType]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('CREATED') || action.includes('PUBLISHED')) {
      return 'bg-status-success/15 text-status-success border-status-success/30';
    }
    if (action.includes('CANCELLED') || action.includes('BANNED') || action.includes('DELETED')) {
      return 'bg-status-error/15 text-status-error border-status-error/30';
    }
    if (action.includes('CORRECTED') || action.includes('ADJUSTED') || action.includes('SUSPENDED')) {
      return 'bg-status-warning/15 text-status-warning border-status-warning/30';
    }
    return 'bg-purple-brand/15 text-purple-bright border-purple-brand/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
              Authoritative Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-void-850 text-void-300 border border-void-700">
              {totalCount} Events Recorded
            </span>
          </div>
          <p className="text-xs text-void-400 mt-1">
            Immutable system logs documenting all sensitive administrative operations and financial state changes.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-2 px-3 py-2 bg-void-850 hover:bg-void-800 border border-void-700 rounded-xl text-void-300 hover:text-void-100 text-xs font-display font-bold uppercase transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-bright' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-void-900 border border-void-700 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-void-400" />
          <span className="text-[11px] font-mono text-void-400 uppercase">Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="bg-void-950 border border-void-700 rounded-lg px-2.5 py-1.5 text-xs text-void-200 font-mono outline-none focus:border-purple-brand"
          >
            <option value="ALL">All Actions</option>
            <option value="MATCH_CREATED">MATCH_CREATED</option>
            <option value="MATCH_UPDATED">MATCH_UPDATED</option>
            <option value="MATCH_STATUS_CHANGED">MATCH_STATUS_CHANGED</option>
            <option value="ROOM_CREDENTIALS_UPDATED">ROOM_CREDENTIALS_UPDATED</option>
            <option value="RESULT_DRAFTED">RESULT_DRAFTED</option>
            <option value="RESULT_PUBLISHED">RESULT_PUBLISHED</option>
            <option value="RESULT_CORRECTED">RESULT_CORRECTED</option>
            <option value="USER_STATUS_UPDATED">USER_STATUS_UPDATED</option>
            <option value="WALLET_ADJUSTED">WALLET_ADJUSTED</option>
            <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
            <option value="BANNER_CREATED">BANNER_CREATED</option>
            <option value="BANNER_UPDATED">BANNER_UPDATED</option>
            <option value="BANNER_DELETED">BANNER_DELETED</option>
            <option value="MATCH_CANCELLED_REFUND_INITIATED">MATCH_CANCELLED_REFUND_INITIATED</option>
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-void-400" />
          <span className="text-[11px] font-mono text-void-400 uppercase">Entity:</span>
          <select
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value);
              setPage(1);
            }}
            className="bg-void-950 border border-void-700 rounded-lg px-2.5 py-1.5 text-xs text-void-200 font-mono outline-none focus:border-purple-brand"
          >
            <option value="ALL">All Entities</option>
            <option value="MATCH">MATCH</option>
            <option value="RESULT">RESULT</option>
            <option value="USER">USER</option>
            <option value="WALLET">WALLET</option>
            <option value="APP_SETTING">APP_SETTING</option>
            <option value="BANNER">BANNER</option>
            <option value="GAME">GAME</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Stream Table */}
      <div className="bg-void-900 border border-void-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-void-800 bg-void-950/60 font-mono text-[10px] text-void-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Target Entity ID</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-void-800 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-void-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
                    Streaming audit events...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-void-500 font-sans">
                    No matching audit records located.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-void-850/50 transition-colors">
                    <td className="py-3 px-4 text-void-300 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight border uppercase ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-void-300 font-bold whitespace-nowrap">
                      {log.entityType}
                    </td>

                    <td className="py-3 px-4 text-void-400 text-[11px] whitespace-nowrap">
                      <span className="bg-void-950 px-2 py-1 rounded border border-void-800">
                        {log.entityId.length > 18 ? `${log.entityId.slice(0, 18)}...` : log.entityId}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-void-100 font-semibold">{log.actorName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-void-800 text-void-400 border border-void-700">
                          {log.actorRole}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-void-500 text-[11px] whitespace-nowrap">
                      {log.ipAddress || 'Internal'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="p-1.5 text-void-400 hover:text-purple-bright hover:bg-void-800 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="Inspect Parameters"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-void-950/60 border-t border-void-800 flex items-center justify-between text-xs font-mono text-void-400">
          <span>
            Page {page} of {totalPages} ({totalCount} total entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-void-700 bg-void-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-void-850 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-void-700 bg-void-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-void-850 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-void-900 border border-void-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-void-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-bright" />
                <h2 className="text-base font-display font-black text-void-100 uppercase tracking-tight">
                  Audit Record Inspection
                </h2>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-void-400 hover:text-void-100 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-void-950 p-4 rounded-xl border border-void-800">
              <div>
                <span className="text-void-500 block text-[10px] uppercase">Audit Event ID</span>
                <span className="text-void-200">{inspectLog.id}</span>
              </div>
              <div>
                <span className="text-void-500 block text-[10px] uppercase">Action Identifier</span>
                <span className="text-purple-bright font-bold">{inspectLog.action}</span>
              </div>
              <div>
                <span className="text-void-500 block text-[10px] uppercase">Target Entity</span>
                <span className="text-void-200">
                  {inspectLog.entityType}: {inspectLog.entityId}
                </span>
              </div>
              <div>
                <span className="text-void-500 block text-[10px] uppercase">Actor Identity</span>
                <span className="text-void-200">
                  {inspectLog.actorName} ({inspectLog.actorRole})
                </span>
              </div>
              <div>
                <span className="text-void-500 block text-[10px] uppercase">Logged Timestamp</span>
                <span className="text-void-200">{new Date(inspectLog.createdAt).toISOString()}</span>
              </div>
              <div>
                <span className="text-void-500 block text-[10px] uppercase">Origin IP</span>
                <span className="text-void-200">{inspectLog.ipAddress || '127.0.0.1 (Internal Agent)'}</span>
              </div>
            </div>

            {/* Sanitized JSON Details */}
            <div>
              <span className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Recorded Execution Details
              </span>
              <pre className="bg-void-950 p-4 rounded-xl border border-void-800 text-xs font-mono text-void-200 overflow-x-auto max-h-64 leading-relaxed">
                {JSON.stringify(inspectLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectLog(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
