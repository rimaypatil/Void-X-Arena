'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { faqsData } from '@/data/faqs';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'General', 'Tournaments', 'App & Room ID', 'Rules & Fair Play'];

  const filteredFaqs = faqsData.filter((faq) => {
    if (selectedCategory === 'ALL') return true;
    return faq.category === selectedCategory;
  });

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-8 sm:py-12 lg:py-20 bg-void-900 relative">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-void-600 mb-1.5 sm:mb-3">
            <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-bright" />
            <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
              Help Center & Rules
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-void-300 mt-1.5 sm:mt-2">
            Everything you need to know about room pass delivery, prize verification, and match rules.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-6 sm:mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider rounded-md transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-brand text-white shadow-purple-sm'
                  : 'bg-void-800 text-void-300 hover:text-void-100 hover:bg-void-700 border border-void-600/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Items */}
        <div className="space-y-2.5 sm:space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-lg bg-void-800 border border-void-600 overflow-hidden transition-colors hover:border-purple-brand/40"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-display font-bold text-xs sm:text-sm md:text-base text-void-100 hover:text-purple-highlight transition-colors"
                >
                  <span className="pr-3 leading-snug">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-void-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-purple-bright' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 text-xs sm:text-sm text-void-300 leading-relaxed border-t border-void-700">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
