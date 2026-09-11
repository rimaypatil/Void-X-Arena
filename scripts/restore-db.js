/**
 * Production Database Restoration Utility
 * Authoritatively restores an archived snapshot into PostgreSQL, ensuring foreign key
 * referential integrity and transactional isolation.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreBackup(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found at: ${filePath}`);
  }

  console.log(`[RESTORE] Loading backup archive: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const snapshot = JSON.parse(raw);

  if (!snapshot.tables || !snapshot.metadata) {
    throw new Error('Invalid snapshot archive: missing tables or metadata.');
  }

  console.log(`[RESTORE] Snapshot created at: ${snapshot.metadata.createdAt}`);
  console.log('[RESTORE] Target record counts:', snapshot.metadata.recordCounts);

  // Restore inside an atomic transaction
  await prisma.$transaction(
    async (tx) => {
      console.log('[RESTORE] Truncating existing tables in reverse dependency order...');
      await tx.resultPlayer.deleteMany();
      await tx.matchResult.deleteMany();
      await tx.walletTransaction.deleteMany();
      await tx.refund.deleteMany();
      await tx.payment.deleteMany();
      await tx.joining.deleteMany();
      await tx.slot.deleteMany();
      await tx.matchRule.deleteMany();
      await tx.match.deleteMany();
      await tx.game.deleteMany();
      await tx.wallet.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.banner.deleteMany();
      await tx.appSetting.deleteMany();
      await tx.user.deleteMany();

      console.log('[RESTORE] Inserting records in dependency order...');

      // 1. Users
      if (snapshot.tables.users?.length) {
        await tx.user.createMany({
          data: snapshot.tables.users.map((u) => ({
            ...u,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          })),
        });
      }

      // 2. Games
      if (snapshot.tables.games?.length) {
        await tx.game.createMany({
          data: snapshot.tables.games.map((g) => ({
            ...g,
            createdAt: new Date(g.createdAt),
            updatedAt: new Date(g.updatedAt),
          })),
        });
      }

      // 3. Matches
      if (snapshot.tables.matches?.length) {
        await tx.match.createMany({
          data: snapshot.tables.matches.map((m) => ({
            ...m,
            matchDate: new Date(m.matchDate),
            registrationStart: new Date(m.registrationStart),
            registrationEnd: new Date(m.registrationEnd),
            roomCredentialsPublishedAt: m.roomCredentialsPublishedAt ? new Date(m.roomCredentialsPublishedAt) : null,
            createdAt: new Date(m.createdAt),
            updatedAt: new Date(m.updatedAt),
          })),
        });
      }

      // 4. Match Rules
      if (snapshot.tables.matchRules?.length) {
        await tx.matchRule.createMany({
          data: snapshot.tables.matchRules,
        });
      }

      // 5. Slots
      if (snapshot.tables.slots?.length) {
        await tx.slot.createMany({
          data: snapshot.tables.slots.map((s) => ({
            ...s,
            reservedAt: s.reservedAt ? new Date(s.reservedAt) : null,
            reservationExpiresAt: s.reservationExpiresAt ? new Date(s.reservationExpiresAt) : null,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          })),
        });
      }

      // 6. Joinings
      if (snapshot.tables.joinings?.length) {
        await tx.joining.createMany({
          data: snapshot.tables.joinings.map((j) => ({
            ...j,
            createdAt: new Date(j.createdAt),
            updatedAt: new Date(j.updatedAt),
          })),
        });
      }

      // 7. Payments
      if (snapshot.tables.payments?.length) {
        await tx.payment.createMany({
          data: snapshot.tables.payments.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })),
        });
      }

      // 8. Refunds
      if (snapshot.tables.refunds?.length) {
        await tx.refund.createMany({
          data: snapshot.tables.refunds.map((r) => ({
            ...r,
            processedAt: r.processedAt ? new Date(r.processedAt) : null,
            createdAt: new Date(r.createdAt),
          })),
        });
      }

      // 9. Wallets
      if (snapshot.tables.wallets?.length) {
        await tx.wallet.createMany({
          data: snapshot.tables.wallets.map((w) => ({
            id: w.id,
            userId: w.userId,
            balance: w.balance,
            winningBalance: w.winningBalance,
            depositBalance: w.depositBalance,
            bonusBalance: w.bonusBalance,
            currency: w.currency,
            updatedAt: new Date(w.updatedAt),
          })),
        });
      }

      // 10. Wallet Transactions
      if (snapshot.tables.walletTransactions?.length) {
        await tx.walletTransaction.createMany({
          data: snapshot.tables.walletTransactions.map((t) => ({
            ...t,
            createdAt: new Date(t.createdAt),
          })),
        });
      }

      // 11. Match Results
      if (snapshot.tables.matchResults?.length) {
        await tx.matchResult.createMany({
          data: snapshot.tables.matchResults.map((mr) => ({
            ...mr,
            publishedAt: mr.publishedAt ? new Date(mr.publishedAt) : null,
            createdAt: new Date(mr.createdAt),
            updatedAt: new Date(mr.updatedAt),
          })),
        });
      }

      // 12. Result Players
      if (snapshot.tables.resultPlayers?.length) {
        await tx.resultPlayer.createMany({
          data: snapshot.tables.resultPlayers,
        });
      }

      // 13. Settings & Banners & Audit Logs & Tokens
      if (snapshot.tables.appSettings?.length) {
        await tx.appSetting.createMany({
          data: snapshot.tables.appSettings.map((s) => ({
            ...s,
            updatedAt: new Date(s.updatedAt),
          })),
        });
      }
      if (snapshot.tables.banners?.length) {
        await tx.banner.createMany({
          data: snapshot.tables.banners.map((b) => ({
            id: b.id,
            title: b.title,
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl,
            displayOrder: b.displayOrder,
            isActive: b.isActive,
            createdAt: new Date(b.createdAt),
          })),
        });
      }
      if (snapshot.tables.auditLogs?.length) {
        await tx.auditLog.createMany({
          data: snapshot.tables.auditLogs.map((al) => ({
            ...al,
            createdAt: new Date(al.createdAt),
          })),
        });
      }
      if (snapshot.tables.refreshTokens?.length) {
        await tx.refreshToken.createMany({
          data: snapshot.tables.refreshTokens.map((rt) => ({
            ...rt,
            expiresAt: new Date(rt.expiresAt),
            createdAt: new Date(rt.createdAt),
          })),
        });
      }
    },
    { timeout: 30000 }
  );

  console.log('[RESTORE] Database restoration completed successfully.');
  return { success: true, restoredSnapshot: snapshot.metadata };
}

if (require.main === module) {
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.error('Usage: node scripts/restore-db.js <path-to-backup.json>');
    process.exit(1);
  }

  restoreBackup(path.resolve(process.cwd(), targetFile))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[RESTORE] Failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { restoreBackup };
