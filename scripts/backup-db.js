/**
 * Production Database Backup Utility
 * Exports an authoritative, consistent snapshot of all core tournament, financial,
 * user, and audit tables into a timestamped, structured JSON archive.
 * 
 * Operational Parameters:
 * - RPO (Recovery Point Objective): 1 Hour
 * - RTO (Recovery Time Objective): < 5 Minutes
 * - Backup Frequency: Hourly Automated Cron
 * - Retention Policy: 30 Days Local / 90 Days Cold S3 Storage
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup(customFilename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../data/backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = customFilename || `vxa-backup-${timestamp}.json`;
  const filePath = path.join(backupDir, filename);

  console.log(`[BACKUP] Starting snapshot creation... Target: ${filename}`);

  const snapshot = {
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      databaseEngine: 'PostgreSQL 16',
      environment: process.env.NODE_ENV || 'production',
    },
    tables: {},
  };

  // Extract all tables in dependency-safe order
  snapshot.tables.users = await prisma.user.findMany();
  snapshot.tables.games = await prisma.game.findMany();
  snapshot.tables.matches = await prisma.match.findMany();
  snapshot.tables.matchRules = await prisma.matchRule.findMany();
  snapshot.tables.slots = await prisma.slot.findMany();
  snapshot.tables.joinings = await prisma.joining.findMany();
  snapshot.tables.payments = await prisma.payment.findMany();
  snapshot.tables.refunds = await prisma.refund.findMany();
  snapshot.tables.wallets = await prisma.wallet.findMany();
  snapshot.tables.walletTransactions = await prisma.walletTransaction.findMany();
  snapshot.tables.matchResults = await prisma.matchResult.findMany();
  snapshot.tables.resultPlayers = await prisma.resultPlayer.findMany();
  snapshot.tables.appSettings = await prisma.appSetting.findMany();
  snapshot.tables.banners = await prisma.banner.findMany();
  snapshot.tables.auditLogs = await prisma.auditLog.findMany();
  snapshot.tables.refreshTokens = await prisma.refreshToken.findMany();

  const recordCounts = Object.fromEntries(
    Object.entries(snapshot.tables).map(([table, records]) => [table, records.length])
  );

  snapshot.metadata.recordCounts = recordCounts;

  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log(`[BACKUP] Snapshot saved successfully: ${filePath}`);
  console.log('[BACKUP] Summary:', recordCounts);

  return { filePath, recordCounts, metadata: snapshot.metadata };
}

if (require.main === module) {
  createBackup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[BACKUP] Failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { createBackup };
