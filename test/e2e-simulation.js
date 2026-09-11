/**
 * VOID X ARENA — Step 3: End-to-End Tournament Lifecycle Simulation
 * Simulates a full tournament from creation -> multi-player reservation -> payment ->
 * match ongoing -> referee scoring -> draft -> publish -> prize distribution & ledger verification.
 */

const { PrismaClient, MatchStatus, JoiningStatus, SlotStatus, ResultStatus, TransactionType } = require('@prisma/client');
const path = require('path');
const jiti = require('jiti')(__filename, {
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
});

const { SlotService } = jiti('../src/lib/tournament/slotService');
const { ResultService } = jiti('../src/lib/tournament/resultService');
const { WalletService } = jiti('../src/lib/wallet/walletService');
const { LeaderboardService } = jiti('../src/lib/tournament/leaderboardService');

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runE2ESimulation() {
  console.log('\n=============================================================');
  console.log('🎮 STARTING END-TO-END TOURNAMENT SIMULATION');
  console.log('=============================================================\n');

  const simId = Date.now().toString().slice(-6);

  // 1. SETUP USERS & ADMIN
  console.log('Step 1: Setting up tournament marshal and contenders...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin user required for simulation.');

  const contenders = [];
  const contenderNames = ['KronoX_King', 'Viper_Ghost', 'Shadow_Sniper', 'Apex_Predator'];

  for (let i = 0; i < contenderNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        email: `sim_${i}_${simId}@vxa.arena`,
        username: `Contender_${contenderNames[i]}_${simId}`,
        fullName: `Player ${contenderNames[i]}`,
        passwordHash: 'sim_secure_hash',
        role: 'USER',
        gameUid: `UID_${1000 + i}_${simId}`,
        gameName: `${contenderNames[i]}`,
        wallet: {
          create: {
            balance: 1000.0,
            depositBalance: 1000.0,
            winningBalance: 0,
            currency: 'INR',
          },
        },
      },
      include: { wallet: true },
    });
    contenders.push(user);
  }
  assert(contenders.length === 4, 'Created 4 unique contenders with funded wallets');

  // 2. CREATE TOURNAMENT MATCH (48 slots, ₹50 entry, ₹15,000 prize pool, ₹25 kill prize)
  console.log('\nStep 2: Admin creates 48-slot Bermuda Battle Royale Championship...');
  const game = await prisma.game.findFirst();
  if (!game) throw new Error('No game found.');

  const match = await prisma.match.create({
    data: {
      contestId: `SIM-MATCH-${simId}`,
      title: `Void X Championship Live Series [SIM-${simId}]`,
      bannerImage: '/assets/images/freefire/battle-royale.jpg',
      gameId: game.id,
      gameMode: 'BATTLE_ROYALE_SQUAD',
      teamType: 'SOLO',
      map: 'Bermuda',
      status: MatchStatus.UPCOMING,
      matchDate: new Date(Date.now() + 7200000),
      matchTime: '09:00 PM IST',
      registrationStart: new Date(Date.now() - 3600000),
      registrationEnd: new Date(Date.now() + 7200000),
      entryFee: 50.0,
      prizeAmount: 15000.0,
      perKillPrize: 25.0,
      totalSlots: 48,
      filledSlots: 0,
      version: 'Mobile Only',
      prizeDistribution: [
        { rank: 1, prize: 7500 },
        { rank: 2, prize: 4000 },
        { rank: 3, prize: 2000 },
        { rank: 4, prize: 1000 },
      ],
      rules: {
        create: [
          { ruleText: 'Mobile devices strictly only. Emulators prohibited.', displayOrder: 1 },
          { ruleText: 'Room credentials unlock 15m prior to match start.', displayOrder: 2 },
        ],
      },
    },
  });

  // Initialize all 48 slots
  const initializedSlots = await SlotService.initializeSlotsForMatch(match.id, 48, 4);
  assert(initializedSlots === 48, 'Initialized 48 individual slot records');

  // 3. MULTI-CONTENDER REGISTRATION & PAYMENT
  console.log('\nStep 3: Contenders reserve slots and complete entry payments...');
  const joinings = [];

  for (let i = 0; i < contenders.length; i++) {
    const contender = contenders[i];
    const slotNumber = i + 1;

    // A. Reserve slot
    const reserveResult = await SlotService.reserveSlotAtomic({
      matchId: match.id,
      slotNumber,
      userId: contender.id,
      inGameName: contender.gameName,
      inGameId: contender.gameUid,
      entryFeePaise: 5000, // ₹50
    });
    assert(reserveResult.success === true, `Contender ${i + 1} successfully reserved slot #${slotNumber}`);
    assert(reserveResult.slot.status === SlotStatus.RESERVED, `Slot #${slotNumber} status is RESERVED`);

    // B. Simulate payment gateway (order -> payment -> webhook confirmation)
    const paymentOrder = await prisma.payment.create({
      data: {
        orderId: `ORDER_SIM_${simId}_${i + 1}`,
        userId: contender.id,
        joiningId: reserveResult.joining.id,
        referenceType: 'MATCH_JOINING',
        referenceId: match.id,
        amount: 50.0,
        currency: 'INR',
        status: 'SUCCESS',
        gatewayName: 'CASHFREE',
        gatewayReferenceId: `CF_PAY_${simId}_${i + 1}`,
        idempotencyKey: `IDEM_PAY_${simId}_${i + 1}`,
      },
    });

    // Deduct entry fee from depositBalance and record TOURNAMENT_ENTRY ledger entry
    const balanceBefore = Number(contender.wallet.balance);
    const balanceAfter = balanceBefore - 50.0;
    await prisma.wallet.update({
      where: { userId: contender.id },
      data: {
        balance: balanceAfter,
        depositBalance: Number(contender.wallet.depositBalance) - 50.0,
      },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: contender.wallet.id,
        userId: contender.id,
        type: TransactionType.TOURNAMENT_ENTRY,
        amount: 50.0,
        balanceBefore,
        balanceAfter,
        referenceType: 'MATCH_JOINING',
        referenceId: match.id,
        status: 'COMPLETED',
        idempotencyKey: `ENTRY_TX_${simId}_${i + 1}`,
        description: `Entry fee for ${match.title}`,
      },
    });

    // C. Confirm slot occupation & joining
    const confirmSuccess = await SlotService.confirmJoiningAndOccupySlot(
      reserveResult.joining.id,
      paymentOrder.orderId
    );
    assert(confirmSuccess === true, `Contender ${i + 1} payment confirmed and slot #${slotNumber} OCCUPIED`);

    const confirmedSlot = await prisma.slot.findUnique({ where: { id: reserveResult.slot.id } });
    assert(confirmedSlot.status === SlotStatus.OCCUPIED, `Slot #${slotNumber} is OCCUPIED`);

    const confirmedJoining = await prisma.joining.findUnique({ where: { id: reserveResult.joining.id } });
    assert(confirmedJoining.status === JoiningStatus.CONFIRMED, `Joining for Contender ${i + 1} is CONFIRMED`);

    joinings.push(confirmedJoining);
  }

  // Verify match filledSlots count
  const metrics = await SlotService.getAuthoritativeSlotMetrics(match.id);
  assert(metrics.occupiedSlots === 4, 'Authoritative metrics confirm 4 occupied slots');
  assert(metrics.availableSlots === 44, 'Authoritative metrics confirm 44 remaining available slots');

  // 4. ADMIN TRANSITIONS MATCH TO ONGOING
  console.log('\nStep 4: Tournament starts. Admin transitions match to ONGOING...');
  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: MatchStatus.ONGOING,
      roomId: '992014',
      roomPassword: '3344',
      roomCredentialsPublishedAt: new Date(),
    },
  });

  const ongoingMatch = await prisma.match.findUnique({ where: { id: match.id } });
  assert(ongoingMatch.status === MatchStatus.ONGOING, 'Match status is ONGOING');

  // Verify My Matches query transitions to ONGOING
  const userMatchesOngoing = await prisma.joining.findMany({
    where: { userId: contenders[0].id },
    include: { match: true },
  });
  assert(userMatchesOngoing[0].match.status === MatchStatus.ONGOING, 'Player My Matches correctly reflects ONGOING');

  // 5. REFEREE RESULT SCORING (DRAFT -> REVIEW -> PUBLISH)
  console.log('\nStep 5: Admin enters match scores as DRAFT and reviews settlement preview...');
  
  // Player 1 (KronoX_King): Rank 1 (Booyah!), 12 kills -> ₹7,500 + 12*25 (₹300) = ₹7,800
  // Player 2 (Viper_Ghost): Rank 2, 7 kills -> ₹4,000 + 7*25 (₹175) = ₹4,175
  // Player 3 (Shadow_Sniper): Rank 3, 4 kills -> ₹2,000 + 4*25 (₹100) = ₹2,100
  // Player 4 (Apex_Predator): Rank 4, 1 kill -> ₹1,000 + 1*25 (₹25) = ₹1,025
  // Total Payout: ₹7,800 + ₹4,175 + ₹2,100 + ₹1,025 = ₹15,100 -> Exceeds ₹15,000!
  // Notice: 15,100 exceeds 15,000! Let's adjust kills so total is <= 15,000:
  // Player 1: 10 kills (₹7,750)
  // Player 2: 5 kills (₹4,125)
  // Player 3: 3 kills (₹2,075)
  // Player 4: 1 kill (₹1,025)
  // Total: ₹7,750 + ₹4,125 + ₹2,075 + ₹1,025 = ₹14,975 <= ₹15,000!

  const draftResult = await ResultService.saveDraft({
    matchId: match.id,
    adminUserId: admin.id,
    players: [
      { joiningId: joinings[0].id, rank: 1, kills: 10 },
      { joiningId: joinings[1].id, rank: 2, kills: 5 },
      { joiningId: joinings[2].id, rank: 3, kills: 3 },
      { joiningId: joinings[3].id, rank: 4, kills: 1 },
    ],
    summary: 'Grand Finals Bermuda Showdown Official Results',
  });

  assert(draftResult.status === ResultStatus.DRAFT, 'Result saved in DRAFT state');
  assert(draftResult.players.length === 4, '4 player scores registered in draft');

  // Verify ₹0 change on wallets while in draft
  const wallet1DuringDraft = await WalletService.getWallet(contenders[0].id);
  assert(wallet1DuringDraft.winningBalance === 0, 'Zero winnings credited during draft state');

  console.log('\nStep 6: Admin publishes official results and triggers authoritative prize settlement...');
  const publishResult = await ResultService.publishResult({
    matchId: match.id,
    adminUserId: admin.id,
  });

  assert(publishResult.status === ResultStatus.PUBLISHED, 'Result is officially PUBLISHED');

  // 6. SYSTEM-LEVEL VERIFICATION
  console.log('\nStep 7: Validating end-to-end tournament invariants...');

  // Invariant 1: Match.status = RESULTED
  const finalizedMatch = await prisma.match.findUnique({ where: { id: match.id } });
  assert(finalizedMatch.status === MatchStatus.RESULTED, 'Match status is RESULTED');

  // Invariant 2: Result.status = PUBLISHED
  const officialResult = await prisma.matchResult.findUnique({ where: { matchId: match.id } });
  assert(officialResult.status === ResultStatus.PUBLISHED, 'MatchResult status is PUBLISHED');

  // Invariant 3: Winner.wallet.winningBalance increased by exact payout
  const winnerWallet = await WalletService.getWallet(contenders[0].id);
  const expectedWinnerPayout = 7500 + (10 * 25); // ₹7,750
  assert(winnerWallet.winningBalance === expectedWinnerPayout, `Winner winningBalance is ₹${expectedWinnerPayout}`);
  assert(winnerWallet.balance === (1000 - 50) + expectedWinnerPayout, `Winner total balance is ₹${winnerWallet.balance}`);

  // Invariant 4: WalletTransaction exists with immutable ledger audit trail
  const winnerTx = await prisma.walletTransaction.findFirst({
    where: {
      userId: contenders[0].id,
      type: TransactionType.PRIZE_WIN,
      referenceId: officialResult.id,
    },
  });
  assert(winnerTx !== null, 'Authoritative WalletTransaction exists for Winner');
  assert(Number(winnerTx.amount) === expectedWinnerPayout, `WalletTransaction amount is ₹${expectedWinnerPayout}`);

  // Invariant 5: Leaderboard reflects winner at #1
  const leaderboard = await LeaderboardService.getLeaderboard({ limit: 10, sortBy: 'earnings' });
  const topContender = leaderboard.entries.find((e) => e.userId === contenders[0].id);
  assert(topContender !== undefined, 'Winner appears on global leaderboard');
  assert(topContender.totalEarnings === expectedWinnerPayout, `Leaderboard earnings match exact prize (₹${expectedWinnerPayout})`);
  assert(topContender.wins === 1, 'Leaderboard reflects 1 tournament win');
  assert(topContender.totalKills === 10, 'Leaderboard reflects 10 total kills');

  // Invariant 6: Profile statistics updated
  const profileStats = await LeaderboardService.getUserStatistics(contenders[0].id);
  assert(profileStats.totalWins === 1, 'Profile stats show 1 victory');
  assert(profileStats.totalKills === 10, 'Profile stats show 10 kills');
  assert(profileStats.totalEarnings === expectedWinnerPayout, `Profile stats show ₹${expectedWinnerPayout} earned`);
  assert(profileStats.podiums === 1, 'Profile stats show 1 podium finish');

  // Invariant 7: My Matches moved to RESULTED
  const userMatchesResulted = await prisma.joining.findMany({
    where: { userId: contenders[0].id },
    include: { match: true },
  });
  assert(userMatchesResulted[0].match.status === MatchStatus.RESULTED, 'My Matches query reflects RESULTED');

  console.log('\n=============================================================');
  console.log('🏆 END-TO-END TOURNAMENT SIMULATION SUCCEEDED WITH 100% INTEGRITY!');
  console.log('=============================================================\n');
}

runE2ESimulation()
  .catch((e) => {
    console.error('Fatal Simulation Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
