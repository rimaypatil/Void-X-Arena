/**
 * VOID X ARENA — Phase 6 Financial Integrity & Adversarial Concurrency Suite
 * Validates system invariants under high concurrency, race conditions, replay attacks, and collisions.
 */

const { PrismaClient, MatchStatus, JoiningStatus, SlotStatus, ResultStatus, TransactionType, TransactionStatus } = require('@prisma/client');
const path = require('path');
const jiti = require('jiti')(__filename, {
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
});

const { SlotService } = jiti('../src/lib/tournament/slotService');
const { AdminMatchService } = jiti('../src/lib/tournament/adminMatchService');
const { MatchCancellationService } = jiti('../src/lib/tournament/matchCancellation');
const { PaymentReconciliationService } = jiti('../src/lib/payments/reconciliationService');
const { ResultService } = jiti('../src/lib/tournament/resultService');
const { WalletService } = jiti('../src/lib/wallet/walletService');
const { getPaymentService } = jiti('../src/lib/payments');

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

async function runAdversarialSuite() {
  console.log('\n================================================================');
  console.log('⚔️  RUNNING PHASE 6 FINANCIAL ADVERSARIAL & CONCURRENCY SUITE');
  console.log('================================================================\n');

  const runId = Date.now().toString().slice(-6);

  // Setup Admin and Game
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', status: 'ACTIVE' } });
  if (!admin) throw new Error('Admin missing');

  let game = await prisma.game.findFirst({ where: { status: 'ACTIVE' } });
  if (!game) {
    game = await prisma.game.create({
      data: {
        name: `Adversarial Arena ${runId}`,
        slug: `adv-arena-${runId}`,
        image: '/assets/images/freefire/battle-royale.jpg',
        gameMode: 'BATTLE_ROYALE_SOLO',
        playerCount: 12,
        status: 'ACTIVE',
      },
    });
  }

  // -------------------------------------------------------------
  // TEST 1: CONCURRENT SLOT CONTENTION (20 contenders -> 1 slot)
  // -------------------------------------------------------------
  console.log('--- TEST 1: CONCURRENT SLOT CONTENTION (20 Users -> 1 Slot) ---');

  const match1 = await AdminMatchService.createMatch({
    contestId: `VXA-ADV1-${runId}`,
    title: `Concurrent Slot Test ${runId}`,
    bannerImage: '/assets/images/freefire/battle-royale.jpg',
    gameId: game.id,
    gameMode: 'BATTLE_ROYALE_SOLO',
    teamType: 'SOLO',
    matchType: 'CLASSIC_CUSTOM',
    map: 'Bermuda',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    matchTime: '08:00 PM IST',
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    entryFee: 50,
    prizeAmount: 1000,
    totalSlots: 10,
    prizeDistribution: [{ rank: 1, prize: 1000 }],
  }, admin.id);

  // Create 20 unique test contenders
  const contenders = [];
  for (let i = 0; i < 20; i++) {
    const u = await prisma.user.create({
      data: {
        email: `contender_${runId}_${i}@voidx.gg`,
        username: `Contender_${runId}_${i}`,
        passwordHash: 'hash',
        role: 'USER',
        status: 'ACTIVE',
        gameUid: `UID_${runId}_${i}`,
      },
    });
    contenders.push(u);
  }

  // 20 simultaneous requests targeting Slot #1
  const reservationPromises = contenders.map((user, idx) =>
    SlotService.reserveSlotAtomic({
      matchId: match1.id,
      slotNumber: 1,
      userId: user.id,
      inGameName: `IGN_${idx}`,
      inGameId: user.gameUid,
      entryFeePaise: 5000,
    }).catch((err) => ({ success: false, error: err.message }))
  );

  const reservationResults = await Promise.all(reservationPromises);
  const successfulReservations = reservationResults.filter((r) => r.success);
  const failedReservations = reservationResults.filter((r) => !r.success);

  assert(
    successfulReservations.length === 1,
    `Exactly ONE reservation succeeded out of 20 concurrent requests (got ${successfulReservations.length})`
  );
  assert(
    failedReservations.length === 19,
    `Exactly 19 concurrent requests were safely rejected (got ${failedReservations.length})`
  );

  const slot1 = await prisma.slot.findUnique({
    where: { matchId_slotNumber: { matchId: match1.id, slotNumber: 1 } },
  });
  assert(
    slot1.status === SlotStatus.RESERVED && slot1.reservedByUserId === successfulReservations[0].slot.reservedByUserId,
    'Database slot record reflects strictly the single winning reservation'
  );

  // -------------------------------------------------------------
  // TEST 2: SAME USER MULTI-DEVICE SIMULTANEOUS RESERVATION RACE
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: SAME USER MULTI-DEVICE SLOT RACE ---');

  const multiDeviceUser = contenders[0];

  // Attempt to claim Slot #2 from Device A and Slot #3 from Device B simultaneously
  const multiDevicePromises = [
    SlotService.reserveSlotAtomic({
      matchId: match1.id,
      slotNumber: 2,
      userId: multiDeviceUser.id,
      inGameName: 'MultiDevice',
      inGameId: multiDeviceUser.gameUid,
      entryFeePaise: 5000,
    }).catch((err) => ({ success: false, error: err.message })),
    SlotService.reserveSlotAtomic({
      matchId: match1.id,
      slotNumber: 3,
      userId: multiDeviceUser.id,
      inGameName: 'MultiDevice',
      inGameId: multiDeviceUser.gameUid,
      entryFeePaise: 5000,
    }).catch((err) => ({ success: false, error: err.message })),
  ];

  const multiDeviceResults = await Promise.all(multiDevicePromises);
  const userJoiningsInMatch = await prisma.joining.findMany({
    where: { matchId: match1.id, userId: multiDeviceUser.id },
  });

  assert(
    userJoiningsInMatch.length === 1,
    `Contender has exactly 1 joining record across simultaneous multi-device attempts (got ${userJoiningsInMatch.length})`
  );

  // -------------------------------------------------------------
  // TEST 3: PAYMENT EXPIRY VS SUCCESS CALLBACK COLLISION
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: PAYMENT EXPIRY VS SUCCESS CALLBACK COLLISION ---');

  const collisionUser = contenders[1];
  const collisionSlotRes = await SlotService.reserveSlotAtomic({
    matchId: match1.id,
    slotNumber: 4,
    userId: collisionUser.id,
    inGameName: 'CollisionTester',
    inGameId: collisionUser.gameUid,
    entryFeePaise: 5000,
  });

  const collisionJoining = collisionSlotRes.joining;

  // Create payment order
  const collisionPayment = await prisma.payment.create({
    data: {
      orderId: `ORD_COL_${runId}`,
      userId: collisionUser.id,
      joiningId: collisionJoining.id,
      referenceId: match1.id,
      referenceType: 'MATCH_JOINING',
      amount: 50,
      currency: 'INR',
      status: 'SUCCESS', // Gateway reports success
      idempotencyKey: `IDEMP_COL_${runId}`,
    },
  });

  // Artificially expire the slot reservation timestamp
  await prisma.slot.update({
    where: { id: collisionSlotRes.slot.id },
    data: { reservationExpiresAt: new Date(Date.now() - 60000) },
  });

  // Concurrently run: A) cleanup worker and B) confirm joining
  const collisionRace = await Promise.all([
    SlotService.cleanupExpiredReservations(match1.id),
    SlotService.confirmJoiningAndOccupySlot(collisionJoining.id, collisionPayment.orderId),
  ]);

  // Verify end state: the slot MUST be OCCUPIED with CONFIRMED joining, because payment was verified SUCCESS
  const finalSlot = await prisma.slot.findUnique({ where: { id: collisionSlotRes.slot.id } });
  const finalJoining = await prisma.joining.findUnique({ where: { id: collisionJoining.id } });

  assert(
    finalSlot.status === SlotStatus.OCCUPIED && finalJoining.status === JoiningStatus.CONFIRMED,
    'Payment success deterministically wins over expiry: slot is OCCUPIED and joining is CONFIRMED'
  );

  // -------------------------------------------------------------
  // TEST 4: CONCURRENT WEBHOOK REPLAY IDEMPOTENCY (10x Webhook)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: CONCURRENT WEBHOOK REPLAY IDEMPOTENCY ---');

  const webhookUser = contenders[2];
  const webhookWalletBefore = await WalletService.getWallet(webhookUser.id);

  const webhookPayment = await prisma.payment.create({
    data: {
      orderId: `ORD_WH_${runId}`,
      userId: webhookUser.id,
      referenceId: `REF_WH_${runId}`,
      referenceType: 'WALLET_TOPUP',
      amount: 200,
      currency: 'INR',
      status: 'PENDING',
      idempotencyKey: `IDEMP_WH_${runId}`,
    },
  });

  // Spy on paymentService.verifyPayment to simulate gateway authoritative SUCCESS confirmation
  const ps = getPaymentService();
  const origVerify = ps.verifyPayment.bind(ps);
  ps.verifyPayment = async (oid) => {
    if (oid === webhookPayment.orderId) {
      return {
        orderId: oid,
        paymentStatus: 'SUCCESS',
        amount: 200,
        referenceId: `CF_WH_${runId}`,
        paymentMethod: 'UPI',
      };
    }
    return origVerify(oid);
  };

  // Simulate 10 simultaneous identical webhooks arriving for the same payment order
  const webhookPromises = Array.from({ length: 10 }, () =>
    PaymentReconciliationService.reconcile({
      orderId: webhookPayment.orderId,
      triggerSource: 'WEBHOOK',
      rawPayload: { event: 'PAYMENT_SUCCESS', amount: 200 },
    }).catch((err) => ({ error: err.message }))
  );

  const webhookResults = await Promise.all(webhookPromises);
  ps.verifyPayment = origVerify; // Restore original

  const updatedWebhookPayment = await prisma.payment.findUnique({ where: { id: webhookPayment.id } });
  assert(updatedWebhookPayment.status === 'SUCCESS', 'Payment marked SUCCESS after reconciliation');

  // Verify wallet transactions count: exactly 1 transaction created
  const walletTransactions = await prisma.walletTransaction.findMany({
    where: { userId: webhookUser.id, referenceId: webhookPayment.id },
  });
  assert(
    walletTransactions.length <= 1,
    'At most 1 ledger transaction created despite 10 simultaneous webhook replays'
  );

  // -------------------------------------------------------------
  // TEST 5: GATEWAY-SPY DOUBLE REFUND PROTECTION (20 Calls -> 1 Gateway Invoke)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: GATEWAY-SPY DOUBLE REFUND PROTECTION ---');

  const matchToCancel = await AdminMatchService.createMatch({
    contestId: `VXA-CNC-ADV-${runId}`,
    title: `Cancel Adv Test ${runId}`,
    bannerImage: '/assets/images/freefire/battle-royale.jpg',
    gameId: game.id,
    gameMode: 'BATTLE_ROYALE_SOLO',
    teamType: 'SOLO',
    matchType: 'CLASSIC_CUSTOM',
    map: 'Bermuda',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    matchTime: '08:00 PM IST',
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    entryFee: 100,
    prizeAmount: 1000,
    totalSlots: 10,
    prizeDistribution: [{ rank: 1, prize: 1000 }],
  }, admin.id);

  await AdminMatchService.transitionStatus({
    matchId: matchToCancel.id,
    newStatus: MatchStatus.UPCOMING,
    adminUserId: admin.id,
  });

  const cancelSlot = await prisma.slot.findFirst({ where: { matchId: matchToCancel.id } });
  const cancelJoining = await prisma.joining.create({
    data: {
      matchId: matchToCancel.id,
      userId: contenders[3].id,
      slotId: cancelSlot.id,
      teamNumber: 1,
      inGameName: 'RefundSpyTest',
      inGameId: 'UID_SPY',
      status: JoiningStatus.CONFIRMED,
      amountPaid: 100,
    },
  });

  const cancelPayment = await prisma.payment.create({
    data: {
      userId: contenders[3].id,
      joiningId: cancelJoining.id,
      referenceId: matchToCancel.id,
      referenceType: 'MATCH_JOINING',
      amount: 100,
      currency: 'INR',
      status: 'SUCCESS',
      orderId: `ORD_SPY_${runId}`,
      idempotencyKey: `IDEMP_SPY_${runId}`,
    },
  });

  // Spy on paymentService.refundPayment
  const paymentService = getPaymentService();
  let gatewayCallCount = 0;
  const originalRefund = paymentService.refundPayment.bind(paymentService);
  paymentService.refundPayment = async (params) => {
    gatewayCallCount++;
    return await originalRefund(params);
  };

  // Launch 20 simultaneous cancellation requests
  const cancelPromises = Array.from({ length: 20 }, () =>
    MatchCancellationService.cancelMatchWithRefunds({
      matchId: matchToCancel.id,
      adminUserId: admin.id,
      reason: 'Concurrent cancel stress test',
    }).catch((err) => ({ error: err.message }))
  );

  await Promise.all(cancelPromises);

  // Restore original method
  paymentService.refundPayment = originalRefund;

  assert(
    gatewayCallCount === 1,
    `Payment gateway refund was invoked EXACTLY ONCE despite 20 concurrent requests (got ${gatewayCallCount})`
  );

  const createdRefunds = await prisma.refund.findMany({
    where: { paymentId: cancelPayment.id },
  });
  assert(
    createdRefunds.length === 1,
    `Database has exactly 1 refund record created (got ${createdRefunds.length})`
  );

  // -------------------------------------------------------------
  // TEST 6: CONCURRENT RESULT SETTLEMENT RACE
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: CONCURRENT REFEREE RESULT PUBLISHING RACE ---');

  const matchToSettle = await AdminMatchService.createMatch({
    contestId: `VXA-SETTLE-${runId}`,
    title: `Settle Test ${runId}`,
    bannerImage: '/assets/images/freefire/battle-royale.jpg',
    gameId: game.id,
    gameMode: 'BATTLE_ROYALE_SOLO',
    teamType: 'SOLO',
    matchType: 'CLASSIC_CUSTOM',
    map: 'Bermuda',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    matchTime: '08:00 PM IST',
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    entryFee: 100,
    prizeAmount: 1500,
    perKillPrize: 25,
    totalSlots: 10,
    prizeDistribution: [{ rank: 1, prize: 1000 }],
  }, admin.id);

  await AdminMatchService.transitionStatus({
    matchId: matchToSettle.id,
    newStatus: MatchStatus.ONGOING,
    adminUserId: admin.id,
  });

  const settleSlot = await prisma.slot.findFirst({ where: { matchId: matchToSettle.id } });
  const settleJoining = await prisma.joining.create({
    data: {
      matchId: matchToSettle.id,
      userId: contenders[4].id,
      slotId: settleSlot.id,
      teamNumber: 1,
      inGameName: 'WinnerPlayer',
      inGameId: 'UID_WIN',
      status: JoiningStatus.CONFIRMED,
      amountPaid: 100,
    },
  });

  const winnerWalletBefore = await WalletService.getWallet(contenders[4].id);
  const winnerBalBefore = winnerWalletBefore.winningBalance;

  const resultItems = [
    {
      slotId: settleSlot.id,
      joiningId: settleJoining.id,
      userId: contenders[4].id,
      rank: 1,
      kills: 4, // 1000 + 4 * 25 = 1100
    },
  ];

  // 2 simultaneous referee publish requests
  const settlePromises = [
    ResultService.publishResult({
      matchId: matchToSettle.id,
      adminUserId: admin.id,
      players: resultItems,
    }).catch((err) => ({ error: err.message })),
    ResultService.publishResult({
      matchId: matchToSettle.id,
      adminUserId: admin.id,
      players: resultItems,
    }).catch((err) => ({ error: err.message })),
  ];

  await Promise.all(settlePromises);

  const winnerWalletAfter = await WalletService.getWallet(contenders[4].id);
  assert(
    winnerWalletAfter.winningBalance === winnerBalBefore + 1100,
    `Winner wallet credited exactly ₹1100 without duplicate credit (balance: ${winnerWalletAfter.winningBalance})`
  );

  const prizeTransactions = await prisma.walletTransaction.findMany({
    where: {
      userId: contenders[4].id,
      type: TransactionType.PRIZE_WIN,
      description: { contains: matchToSettle.title },
    },
  });
  assert(
    prizeTransactions.length === 1,
    `Exactly 1 prize transaction exists in the ledger (got ${prizeTransactions.length})`
  );

  // -------------------------------------------------------------
  // TEST 7: TRANSACTIONAL WALLET LEDGER BALANCE RECONSTRUCTION INVARIANT
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: TRANSACTIONAL WALLET LEDGER BALANCE RECONSTRUCTION INVARIANT ---');

  const allWallets = await prisma.wallet.findMany({
    where: {
      userId: { in: contenders.map((c) => c.id) },
    },
    include: {
      transactions: {
        where: { status: TransactionStatus.COMPLETED },
      },
    },
  });

  let validWalletsCount = 0;
  for (const wallet of allWallets) {
    const storedTotal = Number(wallet.balance);
    let reconstructed = 0;

    for (const tx of wallet.transactions) {
      const amount = Number(tx.amount);
      switch (tx.type) {
        case TransactionType.PRIZE_WIN:
        case TransactionType.REFUND:
          reconstructed += amount;
          break;
        case TransactionType.TOURNAMENT_ENTRY:
        case TransactionType.WITHDRAWAL:
          reconstructed -= amount;
          break;
        case TransactionType.ADJUSTMENT:
          reconstructed += Number(tx.balanceAfter) - Number(tx.balanceBefore);
          break;
      }
    }

    const drift = Math.abs(storedTotal - reconstructed);
    if (drift < 0.01) {
      validWalletsCount++;
    } else {
      console.warn(`  Drift detected in wallet ${wallet.id}: stored=${storedTotal}, reconstructed=${reconstructed}`);
    }
  }

  assert(
    validWalletsCount === allWallets.length,
    `100% of scanned contender wallets (${validWalletsCount}/${allWallets.length}) satisfy the Ledger Reconstruction Invariant`
  );

  console.log('\n================================================================');
  console.log(`🎉 ALL PHASE 6 ADVERSARIAL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('================================================================\n');
}

runAdversarialSuite()
  .catch((err) => {
    console.error('\n❌ ADVERSARIAL SUITE FAILED WITH ERROR:\n', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
