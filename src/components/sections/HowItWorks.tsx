'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Swords, Trophy, Wallet, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'REGISTER',
      description: 'Create your account with your mobile number.\n\nVerify your details and set up your player profile.',
      icon: <UserPlus className="w-5 h-5 text-purple-bright" />,
    },
    {
      step: '02',
      title: 'JOIN MATCH',
      description: 'Select your preferred tournament or match.\n\nPay the required entry fee and confirm your slot.',
      icon: <Swords className="w-5 h-5 text-purple-highlight" />,
    },
    {
      step: '03',
      title: 'PLAY & COMPETE',
      description: 'Join the match at the scheduled time.\n\nCompete with other players and aim for the top position.',
      icon: <Trophy className="w-5 h-5 text-purple-bright" />,
    },
    {
      step: '04',
      title: 'WIN & WITHDRAW',
      description: 'Get instant rewards directly in your wallet.\n\nWithdraw your winnings securely anytime.',
      icon: <Wallet className="w-5 h-5 text-status-success" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-8 sm:py-12 lg:py-20 bg-void-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[200px] sm:h-[300px] bg-purple-brand/5 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-void-600 mb-1.5 sm:mb-3">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-brand" />
            <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
              Quick Setup
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-void-300 mt-1.5 sm:mt-2">
            From app registration to custom room drop in 4 straightforward steps.
          </p>
        </div>

        {/* 4 Steps Grid with Visual Connecting Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 relative">
          {steps.map((item, idx) => (
            <motion.div
              key={item.step}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
              className="relative flex flex-col bg-void-800 border border-void-600 hover:border-purple-brand/60 rounded-xl p-3.5 sm:p-5 lg:p-6 transition-all duration-200 group shadow-card-dark"
            >
              {/* Step Number Top Badge */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                <span className="font-display font-black text-xl sm:text-3xl text-purple-brand/40 group-hover:text-purple-bright transition-colors">
                  {item.step}
                </span>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-void-850 border border-void-700 flex items-center justify-center shadow-inner group-hover:border-purple-brand/40 transition-colors shrink-0">
                  {item.icon}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-black text-sm sm:text-base md:text-lg text-void-100 uppercase tracking-wide mb-1.5">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-void-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>

              {/* Connector indicator on desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-void-600">
                  <ArrowRight className="w-4 h-4 text-void-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
