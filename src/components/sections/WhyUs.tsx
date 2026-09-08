'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart3, Headphones, Award, Smartphone } from 'lucide-react';

export const WhyUs: React.FC = () => {
  const features = [
    {
      title: 'Automated Room Credentials',
      description: 'Zero waiting for manual Discord DMs. Room IDs and passwords push directly to your app 15 minutes prior to match drop.',
      icon: <Zap className="w-5 h-5 text-purple-bright" />,
    },
    {
      title: 'Mobile-Only Integrity',
      description: 'Strict anti-emulator policy. Hardware checks and screen record requirements ensure fair mobile competitive play.',
      icon: <ShieldCheck className="w-5 h-5 text-status-success" />,
    },
    {
      title: 'Transparent Result Logs',
      description: 'Match scores, kill tallies, and replay proofs verify against room stats. Inspect full lobby placement records after every game.',
      icon: <BarChart3 className="w-5 h-5 text-purple-highlight" />,
    },
    {
      title: 'Referee & Dispute Support',
      description: 'Tournament referees monitor every fixture. Report suspicious behavior or disputes with in-app video uploads for fast review.',
      icon: <Headphones className="w-5 h-5 text-purple-blue" />,
    },
    {
      title: 'Diverse Match Modes',
      description: 'Pick between tactical 4v4 clash squads, solo bounty survival, 1v1 snipers, and weekend championship cups.',
      icon: <Award className="w-5 h-5 text-purple-bright" />,
    },
    {
      title: 'Ultra-Lightweight App',
      description: 'Optimized for smooth performance on Android devices without hogging RAM or battery during intense Free Fire sessions.',
      icon: <Smartphone className="w-5 h-5 text-purple-highlight" />,
    },
  ];

  return (
    <section id="why-us" className="py-8 sm:py-12 lg:py-20 bg-void-850 relative">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-void-600 mb-1.5 sm:mb-3">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-brand" />
            <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
              Competitive Advantage
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
            Engineered For Serious Players
          </h2>
          <p className="text-xs sm:text-sm text-void-300 mt-1.5 sm:mt-2">
            Built to eliminate room pass delays, emulator spoofing, and scoring disputes common in casual scrims.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
              className="bg-void-800 border border-void-600 hover:border-purple-brand/50 rounded-xl p-3.5 sm:p-5 lg:p-6 transition-all duration-200 shadow-card-dark"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-void-850 border border-void-700 flex items-center justify-center mb-3 sm:mb-4 shrink-0">
                {feature.icon}
              </div>
              <h3 className="font-display font-black text-sm sm:text-base md:text-lg text-void-100 uppercase tracking-wide mb-1.5">
                {feature.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-void-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
