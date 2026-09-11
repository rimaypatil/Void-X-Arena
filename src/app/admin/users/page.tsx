'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Edit2,
  DollarSign,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface ContenderUser {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  gameUid: string | null;
  gameName: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  role: string;
  wallet: {
    balance: number;
    winningBalance: number;
    depositBalance: number;
  };
  confirmedMatchesCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<ContenderUser[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Change Modal
  const [statusModalUser, setStatusModalUser] = useState<ContenderUser | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'BANNED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  // Wallet Adjustment Modal
  const [walletModalUser, setWalletModalUser] = useState<ContenderUser | null>(null);
  const [amountDelta, setAmountDelta] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/v1/admin/users', window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (search.trim()) url.searchParams.set('search', search.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data.users);
      } else {
        setError(json.error?.message || 'Failed to fetch contenders.');
      }
    } catch {
      setError('Unable to reach user service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser || !accessToken || !statusReason.trim()) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${statusModalUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusModalUser(null);
        setStatusReason('');
        await fetchUsers();
      } else {
        alert(json.error?.message || 'Status update failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalUser || !accessToken || !adjustmentReason.trim()) return;

    setAdjusting(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${walletModalUser.id}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amountDelta: Number(amountDelta), reason: adjustmentReason }),
      });
      const json = await res.json();
      if (json.success) {
        setWalletModalUser(null);
        setAmountDelta(0);
        setAdjustmentReason('');
        await fetchUsers();
      } else {
        alert(json.error?.message || 'Adjustment failed.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            Contender Accounts & Wallets
          </h1>
          <p className="text-xs text-void-400 mt-1">
            Player Free Fire identities, account standing controls, and double-entry wallet ledger management.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-void-900 p-3 rounded-2xl border border-void-700">
        {/* Status Pills */}
        <div className="flex items-center gap-1">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-purple-brand text-white shadow-purple-sm'
                  : 'text-void-300 hover:text-void-100 hover:bg-void-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Username, IGN, UID..."
              className="w-full bg-void-850 border border-void-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-void-800 hover:bg-void-750 text-void-200 border border-void-700 rounded-xl text-xs font-display font-bold uppercase"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-void-700/80 bg-void-850/60 font-display font-bold text-void-400 uppercase tracking-wider">
                <th className="p-3.5 pl-5">Contender</th>
                <th className="p-3.5">Free Fire Identity</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Wallet Balance</th>
                <th className="p-3.5">Matches</th>
                <th className="p-3.5 pr-5 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-void-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-void-400 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
                    Fetching Contenders...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-void-400 font-mono">
                    No registered contenders found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-void-850/50 transition-colors">
                    {/* User */}
                    <td className="p-3.5 pl-5">
                      <div className="font-display font-bold text-void-100 text-sm">{u.username}</div>
                      <div className="text-[11px] text-void-400 font-mono">{u.email}</div>
                    </td>

                    {/* FF Identity */}
                    <td className="p-3.5">
                      <div className="font-display font-bold text-purple-bright">
                        {u.gameName || 'Not Synced'}
                      </div>
                      <div className="text-[10px] font-mono text-void-400">
                        UID: {u.gameUid || 'N/A'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider ${
                          u.status === 'ACTIVE'
                            ? 'bg-status-success/15 text-status-success border border-status-success/40'
                            : u.status === 'SUSPENDED'
                            ? 'bg-status-warning/15 text-status-warning border border-status-warning/40'
                            : 'bg-status-error/15 text-status-error border border-status-error/40'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="p-3.5 font-mono text-xs">
                      <div className="text-void-100 font-bold">₹{u.wallet.balance.toLocaleString()}</div>
                      <div className="text-[10px] text-void-400 flex items-center gap-1">
                        <span>Win: <strong className="text-status-gold">₹{u.wallet.winningBalance}</strong></span>
                        <span>•</span>
                        <span>Dep: ₹{u.wallet.depositBalance}</span>
                      </div>
                    </td>

                    {/* Matches */}
                    <td className="p-3.5 font-mono text-void-300">
                      {u.confirmedMatchesCount} confirmed
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setWalletModalUser(u);
                            setAmountDelta(0);
                            setAdjustmentReason('');
                          }}
                          className="px-2 py-1 bg-void-800 hover:bg-void-750 text-void-200 rounded-lg text-[11px] font-display font-bold uppercase flex items-center gap-1"
                          title="Adjust Contender Wallet Balance"
                        >
                          <Wallet className="w-3 h-3 text-purple-bright" />
                          <span>Adjust</span>
                        </button>

                        <button
                          onClick={() => {
                            setStatusModalUser(u);
                            setNewStatus(u.status);
                            setStatusReason('');
                          }}
                          className="px-2 py-1 bg-void-800 hover:bg-void-750 text-void-200 rounded-lg text-[11px] font-display font-bold uppercase flex items-center gap-1"
                          title="Change Account Standing"
                        >
                          <Edit2 className="w-3 h-3 text-void-400" />
                          <span>Status</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Status Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-void-900 border border-void-700 shadow-2xl">
            <h3 className="text-base font-display font-black text-void-100 uppercase mb-1">
              Update Account Status: {statusModalUser.username}
            </h3>
            <p className="text-xs text-void-400 mb-4">
              Suspended or Banned users are instantly blocked from tournament registrations and authentication.
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Account Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand font-display font-bold uppercase"
                >
                  <option value="ACTIVE">ACTIVE (Normal Access)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporary Hold)</option>
                  <option value="BANNED">BANNED (Permanent Disqualification)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  required
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Suspected emulator usage flagged by referee..."
                  className="w-full bg-void-800 border border-void-700 rounded-xl p-2.5 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  className="px-4 py-2 bg-void-800 hover:bg-void-750 text-void-300 rounded-xl text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm">
                  Save Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Adjustment Modal */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-void-900 border border-void-700 shadow-2xl">
            <h3 className="text-base font-display font-black text-void-100 uppercase mb-1">
              Manual Wallet Adjustment: {walletModalUser.username}
            </h3>
            <p className="text-xs text-void-400 mb-4">
              Generates an immutable compensating ADJUSTMENT ledger transaction. Positive values credit winning balance, negative values debit.
            </p>

            <form onSubmit={handleWalletAdjustment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Amount Delta in ₹ (e.g. 100 or -50)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountDelta}
                  onChange={(e) => setAmountDelta(parseFloat(e.target.value))}
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono font-bold focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Explanatory Reason (Mandatory)
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Compensating credit for referee tiebreaker ruling in match #44..."
                  className="w-full bg-void-800 border border-void-700 rounded-xl p-2.5 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setWalletModalUser(null)}
                  className="px-4 py-2 bg-void-800 hover:bg-void-750 text-void-300 rounded-xl text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm" disabled={adjusting}>
                  {adjusting ? 'Recording Ledger...' : 'Apply Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
