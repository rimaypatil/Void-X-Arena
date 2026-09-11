'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Swords, Lock, User, Mail, Gamepad2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    gameUid: '',
    gameName: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await register(formData);
    setSubmitting(false);

    if (res.success) {
      router.push('/arena');
    } else {
      setError(res.error || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-4 px-1">
      <div className="text-center mb-5">
        <div className="w-20 h-20 mx-auto mb-2.5 flex items-center justify-center">
          <img
            src="/assets/images/logo/logo-full.png"
            alt="Void X Arena Official Logo"
            className="max-h-20 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(124,58,237,0.5)]"
          />
        </div>
        <h2 className="font-display font-black text-xl text-void-100 uppercase tracking-tight">
          Create Contender Account
        </h2>
        <p className="text-xs text-void-300 mt-0.5">
          Join verified Free Fire custom rooms and compete for rewards
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/40 flex items-center gap-2 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. player@gmail.com"
              required
              className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
            Username *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. VX_SniperGod"
              required
              className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
            Password (min 6 characters) *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
              Free Fire UID
            </label>
            <div className="relative">
              <Gamepad2 className="w-4 h-4 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="gameUid"
                value={formData.gameUid}
                onChange={handleChange}
                placeholder="e.g. 749201844"
                className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
              In-Game Name
            </label>
            <input
              type="text"
              name="gameName"
              value={formData.gameName}
              onChange={handleChange}
              placeholder="e.g. VIPER_44"
              className="w-full bg-void-900 border border-void-700 rounded-xl py-2.5 px-3 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand transition-colors"
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
          Complete Registration
        </Button>
      </form>

      <div className="mt-4 text-center text-xs text-void-400">
        Already have an account?{' '}
        <Link
          href="/arena/auth/login"
          className="text-purple-bright font-display font-bold hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
