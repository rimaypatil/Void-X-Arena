export const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/YOUR_TELEGRAM_CHANNEL';

export const siteConfig = {
  name: 'VOID X ARENA',
  shortName: 'VOID X',
  tagline: 'ENTER THE ARENA. COMPETE. DOMINATE. EARN.',
  description: 'The premier competitive esports tournament platform for Free Fire solo, duo, and squad champions. Join verified daily custom rooms, clash squads, and high-stakes battle royale fixtures with instant automated room credentials.',
  url: 'https://voidxarena.gg',
  ogImage: '/assets/images/gaming-retro-bg.jpg',
  navItems: [
    { label: 'Home', href: '#hero' },
    { label: 'Free Fire', href: '#free-fire' },
    { label: 'Game Modes', href: '#game-modes' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Why Void X', href: '#why-us' },
    { label: 'Get App', href: '#app-download' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ],
  downloadUrls: {
    android: process.env.NEXT_PUBLIC_ANDROID_APK_URL || '#app-download',
    ios: '#',
    webArena: '#free-fire',
  },
  socialLinks: {
    discord: 'https://discord.gg/voidxarena',
    telegram: TELEGRAM_URL,
    whatsapp: 'https://whatsapp.com/channel/voidxarena',
    youtube: 'https://youtube.com/@voidxarena',
    instagram: 'https://instagram.com/voidxarena',
  },
  support: {
    email: 'support@voidxarena.gg',
    responseTime: '< 15 mins during active matches',
  },
  stats: {
    activePlayers: 54200,
    tournamentsHosted: 14850,
    prizeDistributed: 2850000, // INR
    onTimeRate: 99.8, // percentage
  },
} as const;
