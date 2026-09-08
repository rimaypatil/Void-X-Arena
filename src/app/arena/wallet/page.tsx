'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  History,
  AlertCircle,
  RefreshCw,
  Trophy,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface WalletData {
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  currency: string;
}

interface WalletTransactionItem {
  id: string;
  type: 'TOURNAMENT_ENTRY' | 'PRIZE_WIN' | 'REFUND' | 'WITHDRAWAL' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  createdAt: string;
}

export default function ArenaWalletPage() {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'ENTRIES' | 'WINNINGS' | 'REFUNDS'>('ALL');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [walletRes, txnRes] = await Promise.all([
        fetch('/api/v1/wallet', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/v1/wallet/transactions?filter=${activeTab}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const walletJson = await walletRes.json();
      const txnJson = await txnRes.json();

      if (walletJson.success && walletJson.data) {
        setWallet(walletJson.data);
      }
      if (txnJson.success && Array.isArray(txnJson.data?.transactions)) {
        setTransactions(txnJson.data.transactions);
      }
    } catch {
      setError('Failed to connect to wallet ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [accessToken, activeTab]);

  if (!user) {
    return (
      <div className="p-6 rounded-2xl bg-void-850 border border-void-700 text-center my-auto">
        <Wallet className="w-12 h-12 text-purple-bright mx-auto mb-3 opacity-80" />
        <h3 className="font-display font-black text-base text-void-100 uppercase tracking-tight">
          Sign In to Access Contender Wallet
        </h3>
        <p className="text-xs text-void-300 mt-1.5 mb-5 max-w-xs mx-auto leading-relaxed">
          Manage your tournament balances, track instant UPI deposits, and claim verified prize pool withdrawals.
        </p>
        <Button asAnchor href="/arena/auth/login" variant="primary" size="md" className="w-full">
          Sign In to Wallet
        </Button>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const winnings = wallet?.winningBalance ?? 0;
  const deposits = wallet?.depositBalance ?? 0;
  const bonus = wallet?.bonusBalance ?? 0;

  return (
    <div className="space-y-4">
      {/* Wallet Balance Hero Card */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-void-800 via-void-850 to-void-900 border border-purple-brand/50 shadow-purple-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-display font-bold uppercase tracking-wider text-void-400">
            Total Spendable Contender Balance
          </span>
          <div className="flex items-center gap-1 text-[9px] font-display font-bold text-status-success bg-status-success/15 px-2 py-0.5 rounded-full border border-status-success/30">
            <ShieldCheck className="w-3 h-3" />
            <span>LEDGER SECURED</span>
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-display font-black text-purple-highlight mt-1">
          ₹{balance.toFixed(2)}
        </p>

        {/* Sub-Balances Breakdown */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-void-750 text-xs">
          <div className="p-2 rounded-lg bg-void-900/80 border border-void-700/60">
            <span className="text-[9px] font-display font-bold uppercase text-void-400 block">
              Winning Cash
            </span>
            <p className="font-display font-black text-sm text-status-success mt-0.5 font-mono">
              ₹{winnings.toFixed(2)}
            </p>
            <span className="text-[8px] text-void-400">Withdrawable via UPI</span>
          </div>

          <div className="p-2 rounded-lg bg-void-900/80 border border-void-700/60">
            <span className="text-[9px] font-display font-bold uppercase text-void-400 block">
              Deposit Cash
            </span>
            <p className="font-display font-black text-sm text-void-100 mt-0.5 font-mono">
              ₹{deposits.toFixed(2)}
            </p>
            <span className="text-[8px] text-void-400">Match entry fees only</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-3.5">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowDownRight className="w-3.5 h-3.5" />}
            className="w-full text-xs shadow-purple-sm"
          >
            Add Funds (UPI)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            className="w-full text-xs"
            disabled={winnings <= 0}
          >
            Withdraw Cash
          </Button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-display font-black uppercase tracking-wider text-void-100 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-purple-bright" />
            <span>Authoritative Ledger</span>
          </h3>
          <button
            onClick={fetchWalletData}
            className="text-[10px] text-void-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pb-1 overflow-x-auto no-scrollbar">
          {(['ALL', 'ENTRIES', 'WINNINGS', 'REFUNDS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-display font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-brand text-white shadow-purple-sm'
                  : 'bg-void-800 text-void-300 border border-void-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {loading && transactions.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-void-850 border border-void-750 animate-pulse h-16" />
            ))}
          </div>
        )}

        {/* Empty Transactions */}
        {!loading && transactions.length === 0 && (
          <div className="p-6 rounded-xl bg-void-850 border border-void-750 text-center">
            <History className="w-8 h-8 text-void-500 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-display font-bold uppercase text-void-300">
              No ledger entries in this category
            </p>
            <span className="text-[10px] text-void-500 mt-0.5 block">
              Every tournament entry, prize win, and gateway refund creates an auditable record here.
            </span>
          </div>
        )}

        {/* Ledger Transaction List */}
        <div className="space-y-2">
          {transactions.map((txn) => {
            const isCredit = txn.type === 'PRIZE_WIN' || txn.type === 'REFUND';
            const isAdjustmentPositive = txn.type === 'ADJUSTMENT' && txn.balanceAfter >= txn.balanceBefore;

            let icon = <ArrowUpRight className="w-4 h-4" />;
            let iconBg = 'bg-status-danger/15 border-status-danger/30 text-status-danger';

            if (txn.type === 'PRIZE_WIN') {
              icon = <Trophy className="w-4 h-4 text-status-success" />;
              iconBg = 'bg-status-success/15 border-status-success/30 text-status-success';
            } else if (txn.type === 'REFUND') {
              icon = <RotateCcw className="w-4 h-4 text-purple-bright" />;
              iconBg = 'bg-purple-brand/20 border-purple-brand/40 text-purple-bright';
            } else if (txn.type === 'ADJUSTMENT') {
              icon = <SlidersHorizontal className="w-4 h-4 text-status-warning" />;
              iconBg = 'bg-status-warning/15 border-status-warning/30 text-status-warning';
            }

            return (
              <div
                key={txn.id}
                className="p-3 rounded-xl bg-void-850 border border-void-700/80 flex items-center justify-between text-xs shadow-card-dark"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-display font-bold text-void-100 text-[11px] leading-snug">
                      {txn.description}
                    </p>
                    <span className="text-[9px] text-void-400 font-mono block mt-0.5">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • Bal: ₹{txn.balanceAfter.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`font-display font-black text-xs font-mono ${
                      isCredit || isAdjustmentPositive ? 'text-status-success' : 'text-status-danger'
                    }`}
                  >
                    {isCredit || isAdjustmentPositive ? '+' : '-'}₹{txn.amount.toFixed(2)}
                  </p>
                  <span className="text-[8px] text-status-success font-display font-bold uppercase tracking-wider block mt-0.5">
                    {txn.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
