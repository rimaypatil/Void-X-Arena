'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Swords, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email/username and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await login(identifier, password);
    setSubmitting(false);

    if (res.success) {
      router.push('/arena');
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-6 px-1">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-purple-brand to-purple-deep flex items-center justify-center text-white shadow-purple-md mb-3">
          <Swords className="w-6 h-6" />
        </div>
        <h2 className="font-display font-black text-xl text-void-100 uppercase tracking-tight">
          Welcome Back, Contender
        </h2>
        <p className="text-xs text-void-300 mt-1">
          Enter credentials to access active tournament fixtures
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/40 flex items-center gap-2 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
            Email or Username
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. viper44@vxa.gg or VX_Viper"
              required
              className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={submitting}
          className="w-full mt-2 shadow-purple-sm"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-void-400">
        New contender?{' '}
        <Link
          href="/arena/auth/register"
          className="text-purple-bright font-display font-bold hover:underline"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}
