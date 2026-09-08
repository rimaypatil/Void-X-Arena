'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Check if device supports fine pointer (mouse)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const isTouch = !mediaQuery.matches || 'ontouchstart' in window;
    setIsTouchDevice(isTouch);

    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('[role="button"]') ||
          target.closest('.interactive-target')
        );
        setIsHoveringInteractive(isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer fluid tracking ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-purple-brand/80 pointer-events-none"
        animate={{
          x: mousePosition.x - (isHoveringInteractive ? 24 : 16),
          y: mousePosition.y - (isHoveringInteractive ? 24 : 16),
          width: isHoveringInteractive ? 48 : 32,
          height: isHoveringInteractive ? 48 : 32,
          scale: isClicking ? 0.8 : 1,
          backgroundColor: isHoveringInteractive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.03)',
        }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 400,
          mass: 0.5,
        }}
      />

      {/* Central precise dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-purple-bright pointer-events-none shadow-[0_0_8px_#A855F7]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isClicking ? 1.5 : isHoveringInteractive ? 0.5 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 35,
          stiffness: 800,
          mass: 0.1,
        }}
      />
    </div>
  );
};
