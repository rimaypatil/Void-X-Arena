'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/sections/Hero';
import { FreeFireArena } from '@/components/sections/FreeFireArena';
import { GameModes } from '@/components/sections/GameModes';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { WhyUs } from '@/components/sections/WhyUs';
import { StatsCounter } from '@/components/sections/StatsCounter';
import { AppShowcase } from '@/components/sections/AppShowcase';
import { Community } from '@/components/sections/Community';
import { FAQSection } from '@/components/sections/FAQSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-void-900 text-void-100 flex flex-col relative overflow-hidden">
      {/* Sticky Header */}
      <Navbar />

      {/* Main Content Sections */}
      <div className="flex-1 flex flex-col">
        <Hero />
        <FreeFireArena />
        <GameModes />
        <HowItWorks />
        <WhyUs />
        <StatsCounter />
        <AppShowcase />
        <Community />
        <FAQSection />
        <ContactSection />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
