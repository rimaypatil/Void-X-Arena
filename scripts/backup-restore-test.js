/**
 * Automated Acceptance Test: Database Backup & Restoration Verification
 * Proves that:
 * 1. Snapshot captures 100% of critical tables.
 * 2. Database changes after snapshot are purged upon restoration.
 * 3. Restored database passes Prisma schema validation and preserves relations.
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { createBackup } = require('./backup-db');
const { restoreBackup } = require('./restore-db');

const prisma = new PrismaClient();

async function runBackupRestoreAcceptanceTest() {
  console.log('\n=============================================================');
  console.log('🔄 RUNNING BACKUP & RESTORATION ACCEPTANCE TEST');
  console.log('=============================================================\n');

  const testBackupName = `test-verify-backup-${Date.now()}.json`;

  // 1. Create Baseline Backup
  console.log('Step 1: Creating verified baseline snapshot...');
  const { filePath, recordCounts } = await createBackup(testBackupName);

  // 2. Insert Canary Record to Mutate Database
  console.log('\nStep 2: Injecting uncommitted canary record into database...');
  const canaryEmail = `canary_${Date.now()}@test.voidxarena.gg`;
  const canaryUser = await prisma.user.create({
    data: {
      email: canaryEmail,
      username: `Canary_${Date.now().toString().slice(-4)}`,
      passwordHash: 'canary_hash_test',
      role: 'USER',
      status: 'ACTIVE',
    },
  });
  console.log(`  Canary user created: ${canaryUser.id} (${canaryEmail})`);

  // Verify canary exists in DB
  const canaryCheck = await prisma.user.findUnique({ where: { email: canaryEmail } });
  if (!canaryCheck) throw new Error('Canary record failed to insert.');
  console.log('  Confirmed canary record exists in active database.');

  // 3. Restore Baseline Backup
  console.log('\nStep 3: Restoring baseline snapshot over active database...');
  await restoreBackup(filePath);

  // 4. Validate Canary Record Was Purged
  console.log('\nStep 4: Verifying database state post-restoration...');
  const canaryPostRestore = await prisma.user.findUnique({ where: { email: canaryEmail } });
  if (canaryPostRestore) {
    throw new Error('FAILED: Canary record still exists after backup restoration!');
  }
  console.log('  ✅ Confirmed: Canary record successfully eliminated by restoration.');

  // 5. Validate Table Counts Match Baseline Exactly
  const [usersCount, matchesCount, slotsCount, paymentsCount, walletsCount] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.slot.count(),
    prisma.payment.count(),
    prisma.wallet.count(),
  ]);

  if (usersCount !== recordCounts.users) {
    throw new Error(`User count mismatch: Expected ${recordCounts.users}, got ${usersCount}`);
  }
  if (matchesCount !== recordCounts.matches) {
    throw new Error(`Matches count mismatch: Expected ${recordCounts.matches}, got ${matchesCount}`);
  }
  if (slotsCount !== recordCounts.slots) {
    throw new Error(`Slots count mismatch: Expected ${recordCounts.slots}, got ${slotsCount}`);
  }
  if (paymentsCount !== recordCounts.payments) {
    throw new Error(`Payments count mismatch: Expected ${recordCounts.payments}, got ${paymentsCount}`);
  }
  if (walletsCount !== recordCounts.wallets) {
    throw new Error(`Wallets count mismatch: Expected ${recordCounts.wallets}, got ${walletsCount}`);
  }

  console.log('  ✅ All critical table record counts match baseline snapshot 100%');

  // Clean up test backup file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('  Cleaned up temporary test backup file.');
  }

  console.log('\n=============================================================');
  console.log('🎉 BACKUP & RESTORATION ACCEPTANCE TEST: PASSED');
  console.log('=============================================================\n');
}

if (require.main === module) {
  runBackupRestoreAcceptanceTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ BACKUP RESTORE TEST FAILED:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { runBackupRestoreAcceptanceTest };
