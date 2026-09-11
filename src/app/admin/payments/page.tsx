'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'REFUNDS'>('PAYMENTS');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = activeTab === 'PAYMENTS' ? '/api/v1/admin/payments' : '/api/v1/admin/refunds';
      const url = new URL(endpoint, window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (search.trim()) url.searchParams.set('search', search.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setItems(activeTab === 'PAYMENTS' ? json.data.payments : json.data.refunds);
      } else {
        setError(json.error?.message || 'Failed to load ledger records.');
      }
    } catch {
      setError('Unable to connect to payment ledger service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter('ALL');
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter, accessToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            Financial Ledger & Reconciliation
          </h1>
          <p className="text-xs text-void-400 mt-1">
            Authoritative Cashfree payment intents, webhook settlements, and automated refund lifecycle audits.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-void-900 p-1 rounded-xl border border-void-700">
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-4 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-colors ${
              activeTab === 'PAYMENTS'
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('REFUNDS')}
            className={`px-4 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-colors ${
              activeTab === 'REFUNDS'
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            Refunds
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-void-900 p-3 rounded-2xl border border-void-700">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(activeTab === 'PAYMENTS'
            ? ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'EXPIRED']
            : ['ALL', 'REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED']
          ).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-purple-brand text-white shadow-purple-sm'
                  : 'text-void-300 hover:text-void-100 hover:bg-void-800'
              }`}
            >
              {st.replace('REFUND_', '')}
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
              placeholder="Search Order ID, Ref..."
              className="w-full bg-void-850 border border-void-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand font-mono"
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

      {/* Table */}
      <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-void-700/80 bg-void-850/60 font-display font-bold text-void-400 uppercase tracking-wider">
                <th className="p-3.5 pl-5">Transaction Order ID</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Contender / Tournament</th>
                <th className="p-3.5">Gateway Info</th>
                <th className="p-3.5 pr-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-void-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-void-400 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
                    Fetching Financial Records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-void-400 font-mono">
                    No financial ledger records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-void-850/50 transition-colors">
                    {/* Order ID */}
                    <td className="p-3.5 pl-5 font-mono text-xs">
                      <div className="font-bold text-void-100">{item.orderId || item.id}</div>
                      <div className="text-[10px] text-void-500">ID: {item.id.slice(0, 12)}...</div>
                    </td>

                    {/* Amount */}
                    <td className="p-3.5 font-mono text-sm font-bold text-void-100">
                      ₹{item.amount.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider ${
                          item.status === 'SUCCESS' || item.status === 'REFUNDED'
                            ? 'bg-status-success/15 text-status-success border border-status-success/40'
                            : item.status === 'PENDING' || item.status === 'REFUND_PENDING'
                            ? 'bg-status-warning/15 text-status-warning border border-status-warning/40'
                            : 'bg-status-error/15 text-status-error border border-status-error/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Match & Contender */}
                    <td className="p-3.5">
                      <div className="font-display font-bold text-void-200">
                        {item.contender ? item.contender.inGameName : item.userId.slice(0, 8)}
                      </div>
                      <div className="text-[10px] font-mono text-void-400 truncate max-w-xs">
                        {item.match ? item.match.title : item.reason || 'Wallet Top-up'}
                      </div>
                    </td>

                    {/* Gateway */}
                    <td className="p-3.5 font-mono text-[11px] text-void-400">
                      <div>{item.gatewayName || 'CASHFREE'}</div>
                      <div className="text-[10px] text-void-500">
                        Ref: {item.gatewayReferenceId || item.gatewayRefundId || 'Direct'}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="p-3.5 pr-5 text-right font-mono text-[11px] text-void-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
