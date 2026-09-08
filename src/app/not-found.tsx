import React from 'react';
import Link from 'next/link';
import { Swords, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-void-800 border border-void-600 rounded-xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-xl bg-purple-brand/20 border border-purple-brand/40 flex items-center justify-center text-purple-bright mx-auto mb-6">
          <Swords className="w-8 h-8" />
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-void-100 uppercase tracking-wide">
          404 - Out Of Bounds
        </h1>
        <p className="text-xs sm:text-sm text-void-300 mt-3 leading-relaxed">
          The arena page you are looking for has expired or moved outside the safe zone.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="relative inline-flex items-center justify-center font-display font-extrabold tracking-wider uppercase transition-all duration-200 select-none overflow-hidden rounded-md group text-center shrink-0 w-full min-h-[42px] px-5 py-2.5 text-sm gap-2 bg-purple-brand hover:bg-purple-hover active:bg-purple-deep text-white shadow-purple-sm hover:shadow-purple-md border border-purple-bright/40"
          >
            <Home className="w-4 h-4" />
            <span>Return to Arena Lobby</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
