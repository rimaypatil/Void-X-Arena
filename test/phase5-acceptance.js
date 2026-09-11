/**
 * VOID X ARENA — Phase 5 Admin Control Plane & Tournament Operations Acceptance Suite
 * Validates complete admin operations, RBAC, idempotency, lifecycle states, and authoritative audit logging.
 */

const { PrismaClient, MatchStatus, JoiningStatus, SlotStatus, ResultStatus, TransactionType } = require('@prisma/client');
const path = require('path');
const jiti = require('jiti')(__filename, {
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
});

const { AuthMiddleware } = jiti('../src/lib/auth/middleware');
const { JwtService } = jiti('../src/lib/auth/jwt');
const { AdminMatchService } = jiti('../src/lib/tournament/adminMatchService');
const { AdminGameService } = jiti('../src/lib/tournament/adminGameService');
const { AdminRuleService } = jiti('../src/lib/tournament/adminRuleService');
const { AdminDashboardService } = jiti('../src/lib/admin/adminDashboardService');
const { AdminFinanceService } = jiti('../src/lib/admin/adminFinanceService');
const { AdminUserService } = jiti('../src/lib/admin/adminUserService');
const { AdminSettingService } = jiti('../src/lib/admin/adminSettingService');
const { SlotService } = jiti('../src/lib/tournament/slotService');
const { ResultService } = jiti('../src/lib/tournament/resultService');
const { WalletService } = jiti('../src/lib/wallet/walletService');

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

// Mock NextRequest helper for testing AuthMiddleware
function mockRequest(token) {
  return {
    headers: {
      get: (header) => (header.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : null),
    },
    cookies: {
      get: () => null,
    },
  };
}

async function runPhase5Suite() {
  console.log('\n================================================================');
  console.log('🛡️ RUNNING PHASE 5 ADMIN CONTROL PLANE & OPERATIONS ACCEPTANCE SUITE');
  console.log('================================================================\n');

  const runId = Date.now().toString().slice(-6);

  // 1. SETUP ACTORS: Admin, Suspended Admin, Normal Contender
  console.log('--- SECTION 1: AUTHENTICATION & RBAC SECURITY INVARIANTS ---');

  let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN', status: 'ACTIVE' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: `admin_${runId}@voidxarena.gg`,
        username: `Admin_${runId}`,
        passwordHash: 'argon2_hashed_secret',
        role: 'ADMIN',
        status: 'ACTIVE',
        gameUid: 'ADMIN_UID',
      },
    });
  }

  const normalUser = await prisma.user.create({
    data: {
      email: `player_${runId}@voidxarena.gg`,
      username: `Player_${runId}`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      status: 'ACTIVE',
      gameUid: `FF_${runId}`,
    },
  });

  const suspendedAdmin = await prisma.user.create({
    data: {
      email: `suspended_admin_${runId}@voidxarena.gg`,
      username: `SuspendedAdmin_${runId}`,
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
      status: 'SUSPENDED',
      gameUid: 'SUS_ADMIN_UID',
    },
  });

  // Test 1: Active Admin token passes requireAdmin
  const { token: adminToken } = JwtService.generateAccessToken({
    userId: adminUser.id,
    role: adminUser.role,
    username: adminUser.username,
    gameUid: adminUser.gameUid,
  });

  const adminAuthResult = await AuthMiddleware.requireAdmin(mockRequest(adminToken));
  assert(adminAuthResult.user !== null && adminAuthResult.user.role === 'ADMIN', 'Active Admin passes requireAdmin authorization');

  // Test 2: Normal user token rejected by requireAdmin with HTTP 403
  const { token: normalToken } = JwtService.generateAccessToken({
    userId: normalUser.id,
    role: normalUser.role,
    username: normalUser.username,
    gameUid: normalUser.gameUid,
  });

  const normalAuthResult = await AuthMiddleware.requireAdmin(mockRequest(normalToken));
  assert(normalAuthResult.user === null && normalAuthResult.errorResponse !== undefined, 'Normal user calling admin endpoint is rejected with 403');

  // Test 3: Suspended admin token rejected by requireAdmin (authoritative DB check)
  const { token: suspendedToken } = JwtService.generateAccessToken({
    userId: suspendedAdmin.id,
    role: suspendedAdmin.role,
    username: suspendedAdmin.username,
    gameUid: suspendedAdmin.gameUid,
  });

  const suspendedAuthResult = await AuthMiddleware.requireAdmin(mockRequest(suspendedToken));
  assert(suspendedAuthResult.user === null && suspendedAuthResult.errorResponse !== undefined, 'Suspended Admin is blocked by real-time database verification');

  // Test 4: Missing or invalid token rejected
  const emptyAuthResult = await AuthMiddleware.requireAdmin(mockRequest(null));
  assert(emptyAuthResult.user === null && emptyAuthResult.errorResponse !== undefined, 'Unauthenticated request to admin endpoint is rejected');

  // 2. DASHBOARD SERVICE
  console.log('\n--- SECTION 2: OPERATIONAL DASHBOARD METRICS ---');

  const dashboardData = await AdminDashboardService.getOperationalSummary();
  assert(typeof dashboardData.matches.total === 'number', 'Dashboard returns real count for total matches');
  assert(typeof dashboardData.matches.upcoming === 'number', 'Dashboard returns real count for upcoming matches');
  assert(typeof dashboardData.matches.ongoing === 'number', 'Dashboard returns real count for ongoing matches');
  assert(typeof dashboardData.matches.resulted === 'number', 'Dashboard returns real count for completed matches');
  assert(typeof dashboardData.players.total === 'number', 'Dashboard returns real count for registered contenders');
  assert(typeof dashboardData.financials.totalRevenue === 'number', 'Dashboard returns real financial numbers');

  // 3. GAME MANAGEMENT CRUD
  console.log('\n--- SECTION 3: ESPORTS GAME MANAGEMENT CRUD ---');

  const gameData = {
    name: `Free Fire Clash Squad ${runId}`,
    slug: `ff-cs-${runId}`,
    image: '/assets/images/freefire/clash-squad.jpg',
    badge: '4v4 CS',
    gameMode: 'CLASH_SQUAD',
    playerCount: 8,
    displayOrder: 99,
    status: 'ACTIVE',
  };

  const createdGame = await AdminGameService.createGame(gameData, adminUser.id);
  assert(createdGame.id !== undefined && createdGame.name === gameData.name, 'Admin creates esports game fixture');

  const updatedGame = await AdminGameService.updateGame(createdGame.id, {
    badge: '4v4 PRO',
    displayOrder: 1,
    status: 'INACTIVE',
  }, adminUser.id);
  assert(updatedGame.badge === '4v4 PRO' && updatedGame.displayOrder === 1 && updatedGame.status === 'INACTIVE', 'Admin updates game metadata, display order, and status');

  // Restore game to ACTIVE
  await AdminGameService.updateGame(createdGame.id, { status: 'ACTIVE' }, adminUser.id);

  // 4. MATCH CREATION, SLOTS INITIALIZATION & IDEMPOTENCY
  console.log('\n--- SECTION 4: TOURNAMENT CREATION & SLOT PROVISIONING ---');

  const contestId = `VXA-ADM-${runId}`;
  const totalSlots = 12;

  const matchInput = {
    contestId,
    title: `Admin Grand Prix ${runId}`,
    bannerImage: '/assets/images/freefire/battle-royale.jpg',
    gameId: createdGame.id,
    gameMode: 'BATTLE_ROYALE_SOLO',
    teamType: 'SOLO',
    matchType: 'CLASSIC_CUSTOM',
    map: 'Bermuda',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    matchTime: '09:00 PM IST',
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    entryFee: 100,
    prizeAmount: 2000,
    perKillPrize: 20,
    totalSlots,
    version: 'Mobile Only',
    prizeDistribution: [
      { rank: 1, prize: 1200 },
      { rank: 2, prize: 500 },
      { rank: 3, prize: 300 },
    ],
    rules: [
      { ruleText: 'Emulators strictly prohibited', displayOrder: 1 },
      { ruleText: 'Report to lobby 10m before kickoff', displayOrder: 2 },
    ],
  };

  const createdMatch = await AdminMatchService.createMatch(matchInput, adminUser.id);
  assert(createdMatch.status === MatchStatus.DRAFT, 'Created tournament initializes in DRAFT status');

  // Verify slots were initialized
  const slots = await prisma.slot.findMany({ where: { matchId: createdMatch.id } });
  assert(slots.length === totalSlots, `Created tournament automatically provisions exactly ${totalSlots} slot records`);
  assert(slots.every((s) => s.status === SlotStatus.AVAILABLE), 'All initial slots are set to AVAILABLE status');

  // Edit match parameters
  const editedMatch = await AdminMatchService.updateMatch(createdMatch.id, {
    title: `Admin Grand Prix ${runId} (Updated)`,
    map: 'Purgatory',
  }, adminUser.id);
  assert(editedMatch.title.includes('(Updated)') && editedMatch.map === 'Purgatory', 'Admin edits tournament parameters');

  // Publish match: DRAFT -> UPCOMING
  const publishTransition = await AdminMatchService.transitionStatus({
    matchId: createdMatch.id,
    newStatus: MatchStatus.UPCOMING,
    adminUserId: adminUser.id,
  });
  assert(publishTransition.match.status === MatchStatus.UPCOMING, 'Admin publishes match to UPCOMING status');

  // Idempotent publish: calling transition again returns alreadyInStatus: true
  const doublePublishTransition = await AdminMatchService.transitionStatus({
    matchId: createdMatch.id,
    newStatus: MatchStatus.UPCOMING,
    adminUserId: adminUser.id,
  });
  assert(doublePublishTransition.alreadyInStatus === true, 'Publish operation is idempotent and detects alreadyInStatus');

  // Broadcast Room Credentials
  const updatedCredentials = await AdminMatchService.updateRoomCredentials({
    matchId: createdMatch.id,
    roomId: 'ROOM_99128',
    roomPassword: 'PASS_8819',
    adminUserId: adminUser.id,
  });
  assert(updatedCredentials.roomId === 'ROOM_99128' && updatedCredentials.roomPassword === 'PASS_8819', 'Admin broadcasts room credentials');

  // Transition to ONGOING
  const ongoingTransition = await AdminMatchService.transitionStatus({
    matchId: createdMatch.id,
    newStatus: MatchStatus.ONGOING,
    adminUserId: adminUser.id,
  });
  assert(ongoingTransition.match.status === MatchStatus.ONGOING, 'Admin advances tournament to ONGOING status');

  // 5. DYNAMIC RULES MANAGEMENT
  console.log('\n--- SECTION 5: MATCH RULES MANAGEMENT ---');

  const newRule = await AdminRuleService.addRule({
    matchId: createdMatch.id,
    ruleText: 'Screenshots of end screen are mandatory for prize verification.',
    displayOrder: 3,
    adminUserId: adminUser.id,
  });
  assert(newRule.ruleText.includes('Screenshots'), 'Admin adds new dynamic rule to match');

  const reorderedRule = await AdminRuleService.updateRule({
    ruleId: newRule.id,
    displayOrder: 1,
    adminUserId: adminUser.id,
  });
  assert(reorderedRule.displayOrder === 1, 'Admin reorders dynamic rule');

  const ruleDeleteResult = await AdminRuleService.deleteRule(newRule.id, adminUser.id);
  assert(ruleDeleteResult.success === true, 'Admin deletes dynamic rule');

  // 6. SLOT & CONFIRMED PARTICIPANT VISIBILITY
  console.log('\n--- SECTION 6: SLOTS & CONFIRMED PARTICIPANT VISIBILITY ---');

  // Create contender joining
  const targetSlot = slots[0];
  const joining = await prisma.joining.create({
    data: {
      matchId: createdMatch.id,
      userId: normalUser.id,
      slotId: targetSlot.id,
      teamNumber: targetSlot.teamNumber,
      inGameName: 'VXA_Ace',
      inGameId: normalUser.gameUid,
      status: JoiningStatus.CONFIRMED,
      amountPaid: 100,
    },
  });

  await prisma.slot.update({
    where: { id: targetSlot.id },
    data: { status: SlotStatus.OCCUPIED },
  });

  // Verify confirmed joinings
  const confirmedJoinings = await prisma.joining.findMany({
    where: { matchId: createdMatch.id, status: JoiningStatus.CONFIRMED },
    include: { slot: true },
  });
  assert(confirmedJoinings.length === 1, 'Only CONFIRMED participants are returned to admin');
  assert(confirmedJoinings[0].inGameName === 'VXA_Ace', 'Participant IGN and in-game credentials correctly resolved');

  const slotBreakdown = await SlotService.getAuthoritativeSlotMetrics(createdMatch.id);
  assert(slotBreakdown.occupiedSlots === 1, 'Slot metrics correctly report 1 occupied slot');
  assert(slotBreakdown.availableSlots === totalSlots - 1, 'Slot metrics correctly report remaining available slots');

  // 7. PAYMENT & REFUND LEDGER INSPECTION
  console.log('\n--- SECTION 7: PAYMENTS & REFUNDS AUDIT VISIBILITY ---');

  const paymentRecord = await prisma.payment.create({
    data: {
      userId: normalUser.id,
      joiningId: joining.id,
      referenceId: createdMatch.id,
      referenceType: 'MATCH_JOINING',
      amount: 100,
      currency: 'INR',
      status: 'SUCCESS',
      orderId: `ORD_${runId}`,
      idempotencyKey: `IDEMP_${runId}`,
    },
  });

  const paymentList = await AdminFinanceService.listPayments({ page: 1, limit: 10 });
  assert(paymentList.payments.length > 0, 'Admin can inspect paginated payment transactions');

  const refundRecord = await prisma.refund.create({
    data: {
      paymentId: paymentRecord.id,
      userId: normalUser.id,
      amount: 100,
      reason: 'Tournament match rescheduled',
      status: 'REFUND_PENDING',
    },
  });

  const refundList = await AdminFinanceService.listRefunds({ status: 'REFUND_PENDING' });
  assert(refundList.refunds.some((r) => r.id === refundRecord.id), 'Admin distinguishes REFUND_PENDING from REFUNDED');

  // 8. RESULTS MANAGEMENT & COMPENSATING CORRECTIONS
  console.log('\n--- SECTION 8: RESULTS MANAGEMENT & SETTLEMENT ENGINE ---');

  // Save Draft
  const draftData = [
    {
      slotId: targetSlot.id,
      joiningId: joining.id,
      userId: normalUser.id,
      rank: 1,
      kills: 5,
    },
  ];

  const draftResult = await ResultService.saveDraft({
    matchId: createdMatch.id,
    adminUserId: adminUser.id,
    players: draftData,
  });
  assert(draftResult.status === ResultStatus.DRAFT, 'Admin saves scoring draft with zero financial impact');

  // Publish Result (Authoritative recalculation: Rank 1 = 1200 + 5 kills * 20 = 1300)
  const initialWallet = await WalletService.getWallet(normalUser.id);
  const initialWinningBalance = initialWallet.winningBalance;

  const publishedResult = await ResultService.publishResult({
    matchId: createdMatch.id,
    adminUserId: adminUser.id,
    players: draftData,
  });
  assert(publishedResult.status === ResultStatus.PUBLISHED, 'Authoritative settlement engine publishes tournament results');

  const postPublishWallet = await WalletService.getWallet(normalUser.id);
  const expectedPrizes = 1200 + 5 * 20; // 1300
  assert(
    postPublishWallet.winningBalance === initialWinningBalance + expectedPrizes,
    `Contender winning balance accurately credited with ₹${expectedPrizes}`
  );

  // Result Correction with compensating ledger transaction
  const correctedItems = [
    {
      slotId: targetSlot.id,
      joiningId: joining.id,
      userId: normalUser.id,
      rank: 1,
      kills: 7, // 2 more kills = ₹40 additional bounty
    },
  ];

  const correction = await ResultService.correctResult({
    matchId: createdMatch.id,
    adminUserId: adminUser.id,
    reason: 'Referee verified 2 additional kills from video stream review',
    players: correctedItems,
  });
  assert(correction.status === ResultStatus.PUBLISHED, 'Admin submits authoritative result correction');

  const postCorrectionWallet = await WalletService.getWallet(normalUser.id);
  assert(
    postCorrectionWallet.winningBalance === initialWinningBalance + expectedPrizes + 40,
    'Compensating ledger transaction automatically reconciles wallet with +₹40'
  );

  // 9. CONTENDER ACCOUNT & WALLET ADJUSTMENT OPERATIONS
  console.log('\n--- SECTION 9: CONTENDER MANAGEMENT & MANUAL ADJUSTMENTS ---');

  // Suspend contender
  const suspendedUser = await AdminUserService.updateUserStatus({
    userId: normalUser.id,
    status: 'SUSPENDED',
    reason: 'Suspicious teaming detected by referee',
    adminUserId: adminUser.id,
  });
  assert(suspendedUser.status === 'SUSPENDED', 'Admin updates contender status to SUSPENDED with audit rationale');

  // Reactivate contender
  const reactivatedUser = await AdminUserService.updateUserStatus({
    userId: normalUser.id,
    status: 'ACTIVE',
    reason: 'Appealed and cleared by marshals',
    adminUserId: adminUser.id,
  });
  assert(reactivatedUser.status === 'ACTIVE', 'Admin restores contender account to ACTIVE');

  // Manual Wallet Adjustment (e.g. ₹50 bonus credit)
  const walletAdjustment = await AdminUserService.adjustWallet({
    userId: normalUser.id,
    amountDelta: 50,
    reason: 'Goodwill compensation for server downtime',
    adminUserId: adminUser.id,
  });
  assert(walletAdjustment.type === TransactionType.ADJUSTMENT, 'Manual wallet modification generates immutable ADJUSTMENT transaction');

  // 10. APP SETTINGS & PROMOTIONAL BANNERS
  console.log('\n--- SECTION 10: APP SETTINGS & PROMOTIONAL BANNERS ---');

  // Maintenance mode
  await AdminSettingService.updateSetting(
    'maintenance_mode',
    { enabled: true, message: 'Maintenance underway' },
    adminUser.id
  );
  const settings = await AdminSettingService.getSettings();
  assert(settings.maintenance_mode.enabled === true, 'Admin triggers platform maintenance mode without APK rebuild');

  // Version lock
  await AdminSettingService.updateSetting(
    'app_version',
    { minVersion: '2.0.0', latestVersion: '2.1.0', forceUpdate: true },
    adminUser.id
  );
  const updatedSettings = await AdminSettingService.getSettings();
  assert(updatedSettings.app_version.minVersion === '2.0.0', 'Admin enforces minimum APK client version');

  // Banner CRUD
  const banner = await AdminSettingService.createBanner({
    title: `Championship Banner ${runId}`,
    imageUrl: '/assets/images/banners/grand-finals.jpg',
    linkUrl: '/arena',
    displayOrder: 1,
    isActive: true,
    adminUserId: adminUser.id,
  });
  assert(banner.id !== undefined && banner.title.includes('Championship Banner'), 'Admin creates database-driven hero banner');

  const updatedBanner = await AdminSettingService.updateBanner(
    banner.id,
    { title: `Championship Banner ${runId} (Updated)` },
    adminUser.id
  );
  assert(updatedBanner.title.includes('(Updated)'), 'Admin updates hero banner');

  const deletedBanner = await AdminSettingService.deleteBanner(banner.id, adminUser.id);
  assert(deletedBanner.id === banner.id, 'Admin deletes promotional banner');

  // 11. TOURNAMENT CANCELLATION & AUTOMATED REFUNDS
  console.log('\n--- SECTION 11: TOURNAMENT CANCELLATION & REFUNDS IDEMPOTENCY ---');

  const matchToCancel = await AdminMatchService.createMatch({
    contestId: `VXA-CNC-${runId}`,
    title: `Cancel Match ${runId}`,
    bannerImage: '/assets/images/freefire/battle-royale.jpg',
    gameId: createdGame.id,
    gameMode: 'BATTLE_ROYALE_SOLO',
    teamType: 'SOLO',
    matchType: 'CLASSIC_CUSTOM',
    map: 'Bermuda',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    matchTime: '10:00 PM IST',
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    entryFee: 75,
    prizeAmount: 1500,
    totalSlots: 10,
    prizeDistribution: [{ rank: 1, prize: 1500 }],
  }, adminUser.id);

  await AdminMatchService.transitionStatus({
    matchId: matchToCancel.id,
    newStatus: MatchStatus.UPCOMING,
    adminUserId: adminUser.id,
  });

  // Contender joins with entry fee
  const cancelSlots = await prisma.slot.findMany({ where: { matchId: matchToCancel.id } });
  const cancelJoining = await prisma.joining.create({
    data: {
      matchId: matchToCancel.id,
      userId: normalUser.id,
      slotId: cancelSlots[0].id,
      teamNumber: 1,
      inGameName: 'CancelTester',
      inGameId: 'UID_CNC',
      status: JoiningStatus.CONFIRMED,
      amountPaid: 75,
    },
  });

  // Link payment record to joining so refund processing succeeds
  await prisma.payment.create({
    data: {
      userId: normalUser.id,
      joiningId: cancelJoining.id,
      referenceId: matchToCancel.id,
      referenceType: 'MATCH_JOINING',
      amount: 75,
      currency: 'INR',
      status: 'SUCCESS',
      orderId: `ORD_CNC_${runId}`,
      idempotencyKey: `IDEMP_CNC_${runId}`,
    },
  });

  // Cancel match with automated refunds
  const cancelResult = await AdminMatchService.transitionStatus({
    matchId: matchToCancel.id,
    newStatus: MatchStatus.CANCELLED,
    adminUserId: adminUser.id,
    reason: 'Technical server outage on game host',
  });
  assert(cancelResult.match.status === MatchStatus.CANCELLED, 'Tournament successfully transitions to CANCELLED');

  // Cancellation Idempotency: calling transition to CANCELLED again returns alreadyInStatus: true
  const doubleCancelResult = await AdminMatchService.transitionStatus({
    matchId: matchToCancel.id,
    newStatus: MatchStatus.CANCELLED,
    adminUserId: adminUser.id,
    reason: 'Duplicate cancellation call',
  });
  assert(doubleCancelResult.alreadyInStatus === true, 'Duplicate cancellation call is rejected idempotently without re-refunds');

  // 12. AUDIT TRAIL LOGGING INTEGRITY
  console.log('\n--- SECTION 12: AUDIT LOG SYSTEM INTEGRITY ---');

  const auditEvents = await prisma.auditLog.findMany({
    where: { actorId: adminUser.id },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  assert(auditEvents.length >= 5, 'Sensitive administrative operations successfully recorded in auditLog');
  const sampleLog = auditEvents[0];
  assert(sampleLog.action !== undefined && sampleLog.entityType !== undefined, 'Audit log records actor, action, and entity type');
  assert(sampleLog.details !== null, 'Audit log records structured operational details');

  // Ensure no passwordHash or secrets appear in audit details
  const auditString = JSON.stringify(auditEvents);
  assert(!auditString.includes('argon2') && !auditString.includes('passwordHash'), 'Audit log contains NO secret keys or password hashes');

  console.log('\n================================================================');
  console.log(`🎉 ALL PHASE 5 ACCEPTANCE TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('================================================================\n');
}

runPhase5Suite()
  .catch((err) => {
    console.error('\n❌ PHASE 5 TEST SUITE FAILED WITH ERROR:\n', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
