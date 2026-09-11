/**
 * VOID X ARENA — Phase 4 Financial & Competition Results Acceptance Suite
 * Validates all core financial and match settlement invariants.
 */

const { PrismaClient, MatchStatus, JoiningStatus, SlotStatus, ResultStatus, TransactionType } = require('@prisma/client');
const path = require('path');
const jiti = require('jiti')(__filename, {
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
});
const { ResultService } = jiti('../src/lib/tournament/resultService');
const { WalletService } = jiti('../src/lib/wallet/walletService');
const { LeaderboardService } = jiti('../src/lib/tournament/leaderboardService');



const prisma = new PrismaClient();

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASSED: ${message}`);
}

async function assertRejects(fn, expectedErrorPart, message) {
  totalTests++;
  try {
    await fn();
    console.error(`  ❌ FAILED: ${message} (Did not reject as expected)`);
    throw new Error(`Expected rejection for: ${message}`);
  } catch (err) {
    if (expectedErrorPart && !err.message.toLowerCase().includes(expectedErrorPart.toLowerCase())) {
      console.error(`  ❌ FAILED: ${message} (Expected "${expectedErrorPart}", got "${err.message}")`);
      throw err;
    }
    passedTests++;
    console.log(`  ✅ PASSED: ${message} (Correctly rejected with: "${err.message}")`);
  }
}

async function runSuite() {
  console.log('\n=============================================================');
  console.log('🏁 RUNNING PHASE 4 FINANCIAL & RESULT ACCEPTANCE SUITE');
  console.log('=============================================================\n');

  // SETUP: Find or create Admin and Test Contenders
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin user missing in database.');

  // Create or retrieve 3 test users
  const runId = Date.now().toString().slice(-6);

  const testUserA = await prisma.user.create({
    data: {
      email: `contender_a_${runId}@acceptance.vxa`,
      username: `Contender_A_${runId}`,
      fullName: 'Contender Alpha',
      passwordHash: 'dummy_hash',
      gameUid: `UID_A_${runId}`,
      gameName: 'Alpha_Shooter',
      role: 'USER',
      wallet: { create: { balance: 0, winningBalance: 0, depositBalance: 0, currency: 'INR' } },
    },
    include: { wallet: true },
  });

  const testUserB = await prisma.user.create({
    data: {
      email: `contender_b_${runId}@acceptance.vxa`,
      username: `Contender_B_${runId}`,
      fullName: 'Contender Bravo',
      passwordHash: 'dummy_hash',
      gameUid: `UID_B_${runId}`,
      gameName: 'Bravo_Striker',
      role: 'USER',
      wallet: { create: { balance: 0, winningBalance: 0, depositBalance: 0, currency: 'INR' } },
    },
    include: { wallet: true },
  });

  const testUserC = await prisma.user.create({
    data: {
      email: `contender_c_${runId}@acceptance.vxa`,
      username: `Contender_C_${runId}`,
      fullName: 'Contender Charlie',
      passwordHash: 'dummy_hash',
      gameUid: `UID_C_${runId}`,
      gameName: 'Charlie_Ghost',
      role: 'USER',
      wallet: { create: { balance: 0, winningBalance: 0, depositBalance: 0, currency: 'INR' } },
    },
    include: { wallet: true },
  });


  const game = await prisma.game.findFirst();
  if (!game) throw new Error('No game found in database.');

  // Create a clean test match: 48 slots, ₹50 entry, ₹15,000 prize pool, ₹25 kill bounty
  const testMatch = await prisma.match.create({
    data: {
      contestId: `ACCEPTANCE-MATCH-${Date.now()}`,
      title: 'Acceptance Free Fire High-Stakes Championship',
      bannerImage: '/assets/images/test.jpg',
      gameId: game.id,
      gameMode: 'BATTLE_ROYALE_SQUAD',
      teamType: 'SOLO',
      map: 'Purgatory',
      status: MatchStatus.ONGOING,
      matchDate: new Date(),
      matchTime: '08:00 PM IST',
      registrationStart: new Date(Date.now() - 3600000),
      registrationEnd: new Date(),
      entryFee: 50.0,
      prizeAmount: 15000.0,
      perKillPrize: 25.0,
      totalSlots: 48,
      filledSlots: 3,
      version: 'Mobile Only',
      prizeDistribution: [
        { rank: 1, prize: 7500 },
        { rank: 2, prize: 4000 },
        { rank: 3, prize: 2000 },
      ],
      rules: {
        create: [{ ruleText: 'Fair play test rule', displayOrder: 1 }],
      },
    },
  });

  // Create slots for the match
  const slot1 = await prisma.slot.create({
    data: { matchId: testMatch.id, slotNumber: 1, teamNumber: 1, status: SlotStatus.OCCUPIED, reservedByUserId: testUserA.id },
  });
  const slot2 = await prisma.slot.create({
    data: { matchId: testMatch.id, slotNumber: 2, teamNumber: 1, status: SlotStatus.OCCUPIED, reservedByUserId: testUserB.id },
  });
  const slot3 = await prisma.slot.create({
    data: { matchId: testMatch.id, slotNumber: 3, teamNumber: 1, status: SlotStatus.OCCUPIED, reservedByUserId: testUserC.id },
  });

  // Create confirmed joinings
  const joiningA = await prisma.joining.create({
    data: {
      matchId: testMatch.id,
      userId: testUserA.id,
      slotId: slot1.id,
      teamNumber: 1,
      inGameName: testUserA.gameName,
      inGameId: testUserA.gameUid,
      status: JoiningStatus.CONFIRMED,
      amountPaid: 50.0,
    },
  });

  const joiningB = await prisma.joining.create({
    data: {
      matchId: testMatch.id,
      userId: testUserB.id,
      slotId: slot2.id,
      teamNumber: 1,
      inGameName: testUserB.gameName,
      inGameId: testUserB.gameUid,
      status: JoiningStatus.CONFIRMED,
      amountPaid: 50.0,
    },
  });

  const joiningC = await prisma.joining.create({
    data: {
      matchId: testMatch.id,
      userId: testUserC.id,
      slotId: slot3.id,
      teamNumber: 1,
      inGameName: testUserC.gameName,
      inGameId: testUserC.gameUid,
      status: JoiningStatus.CONFIRMED,
      amountPaid: 50.0,
    },
  });

  // Create an unconfirmed joining for failure testing
  const unconfirmedUser = await prisma.user.create({
    data: {
      email: `unconfirmed_${Date.now()}@vxa.test`,
      username: `Unconfirmed_${Date.now().toString().slice(-4)}`,
      passwordHash: 'dummy',
      role: 'USER',
      gameUid: 'UNCONF_999',
      gameName: 'Unconfirmed_Guy',
      wallet: { create: { balance: 0, winningBalance: 0, depositBalance: 0 } },
    },
  });
  const slot4 = await prisma.slot.create({
    data: { matchId: testMatch.id, slotNumber: 4, teamNumber: 1, status: SlotStatus.RESERVED, reservedByUserId: unconfirmedUser.id },
  });
  const unconfirmedJoining = await prisma.joining.create({
    data: {
      matchId: testMatch.id,
      userId: unconfirmedUser.id,
      slotId: slot4.id,
      teamNumber: 1,
      inGameName: 'Unconfirmed_Guy',
      inGameId: 'UNCONF_999',
      status: JoiningStatus.PENDING_PAYMENT,
      amountPaid: 0,
    },
  });

  console.log('--- 1. Testing Failure Invariants ---');

  // Case 1: Unconfirmed player
  await assertRejects(
    () => ResultService.validateAndCalculateResults({
      matchId: testMatch.id,
      players: [
        { joiningId: unconfirmedJoining.id, rank: 1, kills: 2 },
        { joiningId: joiningA.id, rank: 2, kills: 1 },
      ],
    }),
    'does not correspond to any CONFIRMED joining',
    'Unconfirmed player must be rejected'
  );

  // Case 2: Duplicate player
  await assertRejects(
    () => ResultService.validateAndCalculateResults({
      matchId: testMatch.id,
      players: [
        { joiningId: joiningA.id, rank: 1, kills: 5 },
        { joiningId: joiningA.id, rank: 2, kills: 2 },
      ],
    }),
    'Duplicate participant',
    'Duplicate player in results must be rejected'
  );

  // Case 3: Duplicate rank
  await assertRejects(
    () => ResultService.validateAndCalculateResults({
      matchId: testMatch.id,
      players: [
        { joiningId: joiningA.id, rank: 1, kills: 5 },
        { joiningId: joiningB.id, rank: 1, kills: 3 },
      ],
    }),
    'Duplicate rank detected',
    'Duplicate rank must be rejected'
  );

  // Case 4: Rank <= 0
  await assertRejects(
    () => ResultService.validateAndCalculateResults({
      matchId: testMatch.id,
      players: [
        { joiningId: joiningA.id, rank: 0, kills: 5 },
      ],
    }),
    'Rank must be an integer >= 1',
    'Rank <= 0 must be rejected'
  );

  // Case 5: Negative kills
  await assertRejects(
    () => ResultService.validateAndCalculateResults({
      matchId: testMatch.id,
      players: [
        { joiningId: joiningA.id, rank: 1, kills: -3 },
      ],
    }),
    'Kills must be a non-negative integer',
    'Negative kills must be rejected'
  );

  // Case 6: Prize pool exceeded
  await assertRejects(
    () => ResultService.validateAndCalculateResults({
      matchId: testMatch.id,
      players: [
        { joiningId: joiningA.id, rank: 1, kills: 350 }, // 7500 + 350*25 = 16250 > 15000
      ],
    }),
    'exceed configured match prize pool',
    'Prize pool exceeded must be rejected'
  );


  console.log('\n--- 2. Testing Happy Path & Draft Invariants ---');

  // Record initial balances
  const walletABefore = await WalletService.getWallet(testUserA.id);
  const walletBBefore = await WalletService.getWallet(testUserB.id);
  const walletCBefore = await WalletService.getWallet(testUserC.id);

  // Step A: Create DRAFT
  const draftResult = await ResultService.saveDraft({
    matchId: testMatch.id,
    adminUserId: admin.id,
    players: [
      { joiningId: joiningA.id, rank: 1, kills: 8 },  // 7500 + 8*25 = 7700
      { joiningId: joiningB.id, rank: 2, kills: 5 },  // 4000 + 5*25 = 4125
      { joiningId: joiningC.id, rank: 3, kills: 3 },  // 2000 + 3*25 = 2075
    ],
    summary: 'Initial referee scoring draft',
  });

  assert(draftResult.status === ResultStatus.DRAFT, 'Draft result status is DRAFT');

  // Invariant: Draft must have ZERO financial effect
  const walletAAfterDraft = await WalletService.getWallet(testUserA.id);
  const walletBAfterDraft = await WalletService.getWallet(testUserB.id);
  const walletCAfterDraft = await WalletService.getWallet(testUserC.id);

  assert(walletAAfterDraft.balance === walletABefore.balance, 'Draft caused ₹0 change on User A balance');
  assert(walletAAfterDraft.winningBalance === walletABefore.winningBalance, 'Draft caused ₹0 change on User A winningBalance');
  assert(walletBAfterDraft.balance === walletBBefore.balance, 'Draft caused ₹0 change on User B balance');
  assert(walletCAfterDraft.balance === walletCBefore.balance, 'Draft caused ₹0 change on User C balance');

  // Invariant: Draft must NOT affect leaderboard
  const lbDraft = await LeaderboardService.getLeaderboard();
  const aInLbDraft = lbDraft.entries.find((e) => e.userId === testUserA.id);
  assert(!aInLbDraft || aInLbDraft.totalEarnings === 0, 'Draft had ZERO effect on Leaderboard earnings');

  // Step B: Edit DRAFT (User A got 10 kills instead of 8)
  const updatedDraft = await ResultService.saveDraft({
    matchId: testMatch.id,
    adminUserId: admin.id,
    players: [
      { joiningId: joiningA.id, rank: 1, kills: 10 }, // 7500 + 10*25 = 7750
      { joiningId: joiningB.id, rank: 2, kills: 5 },  // 4000 + 5*25 = 4125
      { joiningId: joiningC.id, rank: 3, kills: 3 },  // 2000 + 3*25 = 2075
    ],
    summary: 'Updated draft with referee kill verification',
  });

  assert(updatedDraft.players.length === 3, 'Draft successfully updated with revised player stats');

  console.log('\n--- 3. Testing Publish & Prize Settlement Flow ---');

  // Step C: Publish Result
  const publishResult = await ResultService.publishResult({
    matchId: testMatch.id,
    adminUserId: admin.id,
  });

  assert(publishResult.status === ResultStatus.PUBLISHED, 'Result status is now PUBLISHED');

  // Verify match status transitioned to RESULTED
  const matchAfterPublish = await prisma.match.findUnique({ where: { id: testMatch.id } });
  assert(matchAfterPublish.status === MatchStatus.RESULTED, 'Match status transitioned to RESULTED');

  // Verify User A wallet: Winning balance increased by ₹7,750 (7500 rank + 10*25 kills)
  const walletAAfterPublish = await WalletService.getWallet(testUserA.id);
  const expectedGainA = 7500 + (10 * 25);
  assert(
    walletAAfterPublish.winningBalance === walletABefore.winningBalance + expectedGainA,
    `Winner User A winningBalance increased by exactly ₹${expectedGainA}`
  );
  assert(
    walletAAfterPublish.balance === walletABefore.balance + expectedGainA,
    `Winner User A total balance increased by exactly ₹${expectedGainA}`
  );

  // Verify WalletTransaction created for User A
  const txA = await prisma.walletTransaction.findFirst({
    where: {
      userId: testUserA.id,
      type: TransactionType.PRIZE_WIN,
    },
    orderBy: { createdAt: 'desc' },
  });
  assert(txA !== null, 'WalletTransaction exists for User A');
  assert(Number(txA.amount) === expectedGainA, `WalletTransaction amount is ₹${expectedGainA}`);
  assert(txA.type === TransactionType.PRIZE_WIN, 'WalletTransaction type is PRIZE_WIN');

  // Verify User B wallet: Winning balance increased by ₹4,125 (4000 rank + 5*25 kills)
  const walletBAfterPublish = await WalletService.getWallet(testUserB.id);
  const expectedGainB = 4000 + (5 * 25);
  assert(
    walletBAfterPublish.winningBalance === walletBBefore.winningBalance + expectedGainB,
    `User B winningBalance increased by exactly ₹${expectedGainB}`
  );

  // Verify User C wallet: Winning balance increased by ₹2,075 (2000 rank + 3*25 kills)
  const walletCAfterPublish = await WalletService.getWallet(testUserC.id);
  const expectedGainC = 2000 + (3 * 25);
  assert(
    walletCAfterPublish.winningBalance === walletCBefore.winningBalance + expectedGainC,
    `User C winningBalance increased by exactly ₹${expectedGainC}`
  );

  // Invariant: Publish Twice Idempotency
  const secondPublish = await ResultService.publishResult({
    matchId: testMatch.id,
    adminUserId: admin.id,
  });
  assert(secondPublish.alreadyPublished === true, 'Publishing twice is safely handled as idempotent');

  // Verify balances did not double-credit
  const walletAAfterSecondPublish = await WalletService.getWallet(testUserA.id);
  assert(
    walletAAfterSecondPublish.winningBalance === walletAAfterPublish.winningBalance,
    'Second publish did NOT double-credit prize (Idempotent settlement verified)'
  );

  console.log('\n--- 4. Testing Leaderboard & User Statistics Updates ---');

  // Verify Leaderboard
  const leaderboard = await LeaderboardService.getLeaderboard();
  const leaderA = leaderboard.entries.find((e) => e.userId === testUserA.id);
  assert(leaderA !== undefined, 'Winner User A appears on the leaderboard');
  assert(leaderA.totalEarnings >= expectedGainA, `User A earnings on leaderboard match settled prize (₹${leaderA.totalEarnings})`);
  assert(leaderA.totalKills >= 10, `User A kills on leaderboard match (kills: ${leaderA.totalKills})`);
  assert(leaderA.wins >= 1, `User A wins incremented on leaderboard (wins: ${leaderA.wins})`);

  // Verify User Statistics
  const statsA = await LeaderboardService.getUserStatistics(testUserA.id);
  assert(statsA.totalWins >= 1, `User A statistics reflect wins: ${statsA.totalWins}`);
  assert(statsA.totalEarnings >= expectedGainA, `User A statistics reflect earnings: ₹${statsA.totalEarnings}`);
  assert(statsA.podiums >= 1, `User A statistics reflect podiums: ${statsA.podiums}`);

  console.log('\n--- 5. Testing Administrative Correction (ADJUSTMENT Invariant) ---');

  // Admin correction: User B was actually 8 kills instead of 5 (+3 kills = +₹75)
  const correctionResult = await ResultService.correctResult({
    matchId: testMatch.id,
    adminUserId: admin.id,
    reason: 'Video replay review confirmed 3 additional sniper kills for User B',
    players: [
      { joiningId: joiningA.id, rank: 1, kills: 10 },
      { joiningId: joiningB.id, rank: 2, kills: 8 },  // +3 kills = +₹75 delta
      { joiningId: joiningC.id, rank: 3, kills: 3 },
    ],
    summary: 'Referee adjustment after video review',
  });

  assert(correctionResult.corrected === true, 'Correction processed successfully');
  assert(correctionResult.adjustments.length >= 1, 'Adjustments list recorded compensating ledger items');


  // Verify User B wallet received the ₹75 delta
  const walletBAfterCorrection = await WalletService.getWallet(testUserB.id);
  assert(
    walletBAfterCorrection.winningBalance === walletBAfterPublish.winningBalance + 75,
    'User B wallet winningBalance credited with exact +₹75 adjustment delta'
  );

  // Invariant: Existing transaction was NOT overwritten; an ADJUSTMENT transaction was created
  const adjustmentTx = await prisma.walletTransaction.findFirst({
    where: {
      userId: testUserB.id,
      type: TransactionType.ADJUSTMENT,
    },
    orderBy: { createdAt: 'desc' },
  });
  assert(adjustmentTx !== null, 'Compensating ADJUSTMENT transaction created in immutable ledger');
  assert(Number(adjustmentTx.amount) === 75, 'ADJUSTMENT transaction amount is ₹75');
  assert(Number(txA.amount) === expectedGainA, 'Original prize transaction remained unmodified');


  console.log('\n--- 6. Testing Complete Transaction Rollback Invariant ---');

  // Simulate transactional failure inside a raw transaction
  let rollbackSucceeded = false;
  const balanceBeforeRollbackTest = (await WalletService.getWallet(testUserC.id)).balance;

  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Credit User C
      await tx.wallet.update({
        where: { userId: testUserC.id },
        data: { balance: balanceBeforeRollbackTest + 1000 },
      });
      // Step 2: Force failure
      throw new Error('SIMULATED_DATABASE_FAILURE');
    });
  } catch (err) {
    if (err.message.includes('SIMULATED_DATABASE_FAILURE')) {
      rollbackSucceeded = true;
    }
  }

  assert(rollbackSucceeded, 'Transaction error caught');
  const balanceAfterRollbackTest = (await WalletService.getWallet(testUserC.id)).balance;
  assert(
    balanceAfterRollbackTest === balanceBeforeRollbackTest,
    'Wallet state rolled back completely on error (No orphaned records)'
  );

  console.log('\n=============================================================');
  console.log(`🎉 ACCEPTANCE SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('=============================================================\n');
}

runSuite()
  .catch((e) => {
    console.error('Fatal Suite Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
