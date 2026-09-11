const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

class PasswordService {
  static async hash(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`pbkdf2$100000$${salt}$${derivedKey.toString('hex')}`);
      });
    });
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding VOID X ARENA PostgreSQL database...');

  // 1. System Settings
  await prisma.appSetting.upsert({
    where: { key: 'system_status' },
    update: {},
    create: {
      key: 'system_status',
      value: {
        maintenanceMode: false,
        maintenanceTitle: 'Void X Arena Maintenance',
        maintenanceMessage: 'The arena is currently undergoing scheduled infrastructure upgrades. Matches will resume shortly.',
        minAppVersion: '1.0.0',
        latestAppVersion: '1.0.0',
        forceUpdate: false,
        apkDownloadUrl: 'https://voidxarena.gg/downloads/voidxarena-v1.0.apk',
      },
      description: 'Global mobile client versioning and maintenance control',
    },
  });

  // 2. Admin & User Accounts
  const adminPasswordHash = await PasswordService.hash('Admin@VoidX2026');
  const userPasswordHash = await PasswordService.hash('Player@VoidX2026');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@voidxarena.gg' },
    update: {},
    create: {
      email: 'admin@voidxarena.gg',
      username: 'VX_SystemAdmin',
      fullName: 'Void X Lead Marshal',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      gameUid: '990011223',
      gameName: 'VX_ADMIN_OFFICIAL',
      wallet: {
        create: {
          balance: 50000.0,
          depositBalance: 50000.0,
        },
      },
    },
  });

  const player1 = await prisma.user.upsert({
    where: { email: 'player1@vxa.gg' },
    update: {},
    create: {
      email: 'player1@vxa.gg',
      username: 'VX_ViperStrike',
      fullName: 'Aarav Sharma',
      passwordHash: userPasswordHash,
      role: 'USER',
      gameUid: '749201844',
      gameName: 'VIPER_44',
      wallet: {
        create: {
          balance: 1450.0,
          winningBalance: 1200.0,
          depositBalance: 250.0,
        },
      },
    },
  });

  const player2 = await prisma.user.upsert({
    where: { email: 'player2@vxa.gg' },
    update: {},
    create: {
      email: 'player2@vxa.gg',
      username: 'KronoX_99',
      fullName: 'Rohan Verma',
      passwordHash: userPasswordHash,
      role: 'USER',
      gameUid: '839102844',
      gameName: 'KronoX_God',
      wallet: {
        create: {
          balance: 850.0,
          winningBalance: 600.0,
          depositBalance: 250.0,
        },
      },
    },
  });

  // 3. Esports Games
  const brGame = await prisma.game.upsert({
    where: { slug: 'free-fire-battle-royale' },
    update: {},
    create: {
      slug: 'free-fire-battle-royale',
      name: 'Free Fire Battle Royale',
      image: '/assets/images/freefire/battle-royale.jpg',
      gameMode: 'BATTLE_ROYALE_SQUAD',
      playerCount: 48,
      displayOrder: 1,
      badge: 'FEATURED',
    },
  });

  const csGame = await prisma.game.upsert({
    where: { slug: 'free-fire-clash-squad' },
    update: {},
    create: {
      slug: 'free-fire-clash-squad',
      name: 'Free Fire Clash Squad',
      image: '/assets/images/freefire/clash-squad.jpg',
      gameMode: 'CLASH_SQUAD_4V4',
      playerCount: 16,
      displayOrder: 2,
      badge: 'POPULAR',
    },
  });

  const duelGame = await prisma.game.upsert({
    where: { slug: 'free-fire-lone-wolf' },
    update: {},
    create: {
      slug: 'free-fire-lone-wolf',
      name: 'Free Fire 1v1 Precision Duel',
      image: '/assets/images/freefire/esports.jpg',
      gameMode: 'DUEL_1V1',
      playerCount: 2,
      displayOrder: 3,
      badge: 'HIGH STAKES',
    },
  });

  // 4. Matches
  const now = new Date();
  const today1930 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30, 0);
  const today2030 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0);

  // Match 1: Upcoming Battle Royale
  const match1 = await prisma.match.upsert({
    where: { contestId: 'VXA-FF-001' },
    update: {},
    create: {
      contestId: 'VXA-FF-001',
      title: 'Free Fire Bermuda Squad Bloodbath',
      bannerImage: '/assets/images/freefire/battle-royale.jpg',
      gameId: brGame.id,
      gameMode: 'BATTLE_ROYALE_SQUAD',
      teamType: 'SQUAD',
      map: 'Bermuda',
      status: 'UPCOMING',
      matchDate: today1930,
      matchTime: '07:30 PM IST',
      registrationStart: new Date(Date.now() - 3600 * 1000 * 4),
      registrationEnd: today1930,
      entryFee: 30.0,
      prizeAmount: 2500.0,
      perKillPrize: 25.0,
      totalSlots: 48,
      filledSlots: 1,
      version: 'Mobile Only',
      roomId: '984210',
      roomPassword: '7788',
      roomCredentialsPublishedAt: new Date(today1930.getTime() - 15 * 60 * 1000),
      prizeDistribution: [
        { rank: '1st Place (Booyah)', amount: '₹1,000' },
        { rank: '2nd Place', amount: '₹500' },
        { rank: '3rd Place', amount: '₹250' },
        { rank: 'Per Kill Bounty', amount: '₹25 per kill' },
      ],
      rules: {
        create: [
          { ruleText: 'Mobile devices strictly only. Emulators will be instantly disqualified.', displayOrder: 1 },
          { ruleText: 'Room credentials unlock automatically inside the Void X Arena app 15 mins before drop.', displayOrder: 2 },
          { ruleText: 'All squad members must use verified in-game IDs submitted during registration.', displayOrder: 3 },
          { ruleText: 'Strict zero-tolerance anti-cheat policy with referee match logging.', displayOrder: 4 },
        ],
      },
    },
  });

  // Create slots for Match 1
  for (let s = 1; s <= 48; s++) {
    const teamNum = Math.ceil(s / 4);
    const pos = ((s - 1) % 4) + 1;
    await prisma.slot.upsert({
      where: {
        matchId_slotNumber: {
          matchId: match1.id,
          slotNumber: s,
        },
      },
      update: {},
      create: {
        matchId: match1.id,
        slotNumber: s,
        teamNumber: teamNum,
        position: pos,
        status: s === 1 ? 'OCCUPIED' : 'AVAILABLE',
        reservedByUserId: s === 1 ? player1.id : null,
      },
    });
  }

  // Confirm slot 1 joining for player 1
  const slot1 = await prisma.slot.findUnique({
    where: {
      matchId_slotNumber: {
        matchId: match1.id,
        slotNumber: 1,
      },
    },
  });

  if (slot1) {
    await prisma.joining.upsert({
      where: { id: 'joining-seed-001' },
      update: {},
      create: {
        id: 'joining-seed-001',
        matchId: match1.id,
        userId: player1.id,
        slotId: slot1.id,
        teamNumber: 1,
        inGameName: player1.gameName || 'VIPER_44',
        inGameId: player1.gameUid || '749201844',
        status: 'CONFIRMED',
        amountPaid: 30.0,
      },
    });
  }

  // Match 2: Clash Squad 4v4
  const match2 = await prisma.match.upsert({
    where: { contestId: 'VXA-FF-002' },
    update: {},
    create: {
      contestId: 'VXA-FF-002',
      title: 'Clash Squad 4v4 Strike Knockout',
      bannerImage: '/assets/images/freefire/clash-squad.jpg',
      gameId: csGame.id,
      gameMode: 'CLASH_SQUAD_4V4',
      teamType: 'SQUAD',
      map: 'Clock Tower / Factory',
      status: 'UPCOMING',
      matchDate: today2030,
      matchTime: '08:30 PM IST',
      registrationStart: new Date(Date.now() - 3600 * 1000 * 4),
      registrationEnd: today2030,
      entryFee: 50.0,
      prizeAmount: 1200.0,
      totalSlots: 16,
      filledSlots: 0,
      version: 'Mobile Only',
      prizeDistribution: [
        { rank: 'Winner Team', amount: '₹900' },
        { rank: 'Runner-up Team', amount: '₹300' },
      ],
      rules: {
        create: [
          { ruleText: 'Default Gun Attributes OFF, Character Skills Allowed.', displayOrder: 1 },
          { ruleText: 'Limited Ammo: YES, Fall Damage: YES, Gun Properties: OFF.', displayOrder: 2 },
          { ruleText: 'Screenshots of the final MVP & score screen must be submitted post-match.', displayOrder: 3 },
        ],
      },
    },
  });

  for (let s = 1; s <= 16; s++) {
    const teamNum = Math.ceil(s / 4);
    const pos = ((s - 1) % 4) + 1;
    await prisma.slot.upsert({
      where: {
        matchId_slotNumber: {
          matchId: match2.id,
          slotNumber: s,
        },
      },
      update: {},
      create: {
        matchId: match2.id,
        slotNumber: s,
        teamNumber: teamNum,
        position: pos,
        status: 'AVAILABLE',
      },
    });
  }

  // 5. Banners
  await prisma.banner.upsert({
    where: { id: 'banner-001' },
    update: {},
    create: {
      id: 'banner-001',
      title: 'Void X Free Fire Season 1 Championship',
      imageUrl: '/assets/images/freefire/esports.jpg',
      linkUrl: '/arena/matches',
      displayOrder: 1,
      isActive: true,
    },
  });

  console.log('PostgreSQL database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
