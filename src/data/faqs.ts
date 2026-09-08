import { FAQItem } from '@/types/tournament';

export const faqsData: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What is Void X Arena and how do tournaments work?',
    answer: 'Void X Arena is a competitive esports tournament platform created for passionate Free Fire mobile players. We host verified daily tournaments including Battle Royale Solo/Squad, Clash Squad 4v4, and 1v1 duels. Players register for fixtures in the Void X Arena App, receive automated custom room credentials (Room ID and Password) prior to match start, and compete for transparent prize pools based on placement and kill bounties.',
    category: 'General',
  },
  {
    id: 'faq-2',
    question: 'How and when do I receive the Room ID and Password?',
    answer: 'Once you register for a tournament fixture, your slot is secured. The Custom Room ID and Password are delivered automatically inside the Void X Arena mobile app exactly 15 minutes before the match start time. You will also receive an instant push notification on your device so you never miss a lobby drop.',
    category: 'App & Room ID',
  },
  {
    id: 'faq-3',
    question: 'Are emulators (PC / Bluestacks / LDPlayer) allowed?',
    answer: 'No. Unless a fixture is explicitly labeled as "Open/PC", all standard Void X Arena tournaments are strictly mobile-only (Android & iOS). Players caught joining custom rooms via PC emulators or using hardware macro scripts will be immediately kicked and banned from the platform to protect mobile competitive integrity.',
    category: 'Rules & Fair Play',
  },
  {
    id: 'faq-4',
    question: 'How are match results and kills verified?',
    answer: 'Void X Arena uses an automated post-match verification system combined with referee review. Top-placing players and winners upload their end-game Booyah/Scoreboard screenshots directly in the app. Match logs and kill feeds are cross-checked against room data to guarantee 100% accurate results before prize pool distribution.',
    category: 'Tournaments',
  },
  {
    id: 'faq-5',
    question: 'How do prize payouts work on Void X Arena?',
    answer: 'Once the tournament concludes and results are verified (typically within 15 to 30 minutes of match completion), winning shares and kill bounties are credited directly to your Void X Arena wallet balance. You can track all past match earnings and transaction histories with full transparency.',
    category: 'Tournaments',
  },
  {
    id: 'faq-6',
    question: 'What happens if a registered player does not join the custom room on time?',
    answer: 'Custom rooms start strictly at the scheduled time. If a player fails to join before the room host starts the match, their slot cannot be re-opened, and entry fees cannot be refunded. We recommend joining the room at least 5-7 minutes before the match start countdown ends.',
    category: 'Rules & Fair Play',
  },
  {
    id: 'faq-7',
    question: 'How do I download and install the Void X Arena app?',
    answer: 'You can download the official Void X Arena Android APK directly from our website using the "Download App" button. For iOS users, web tournament joining and TestFlight builds are currently being rolled out.',
    category: 'App & Room ID',
  },
  {
    id: 'faq-8',
    question: 'What should I do if I encounter a hacker or cheater in my match?',
    answer: 'Void X Arena maintains a zero-tolerance policy against cheating, mod menus, wallhacks, and teaming. If you suspect foul play, simply submit a match dispute with screen recording / spectator footage to our 24/7 referee support team within 30 minutes of match completion. Confirmed cheaters receive permanent hardware bans.',
    category: 'Rules & Fair Play',
  },
];
