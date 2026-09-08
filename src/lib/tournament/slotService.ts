import { prisma } from '@/lib/db/prisma';
import { SlotStatus, JoiningStatus } from '@prisma/client';
import { PaymentReconciliationService } from '@/lib/payments/reconciliationService';

export interface DerivedSlotCounts {
  totalSlots: number;
  availableSlots: number;
  reservedSlots: number;
  occupiedSlots: number;
  fillPercentage: number;
}

export class SlotService {
  public static readonly RESERVATION_WINDOW_MINUTES = 10;

  /**
   * Initializes real individual database records for all slots in a match.
   * e.g. for totalSlots = 48 (Squad): 12 teams of 4 positions each.
   */
  static async initializeSlotsForMatch(matchId: string, totalSlots: number, teamSize = 4): Promise<number> {
    const existingCount = await prisma.slot.count({ where: { matchId } });
    if (existingCount >= totalSlots) {
      return existingCount;
    }

    const slotsToCreate = [];
    for (let s = existingCount + 1; s <= totalSlots; s++) {
      const teamNumber = Math.ceil(s / teamSize);
      const position = ((s - 1) % teamSize) + 1;
      slotsToCreate.push({
        matchId,
        slotNumber: s,
        teamNumber,
        position,
        status: SlotStatus.AVAILABLE,
      });
    }

    await prisma.slot.createMany({
      data: slotsToCreate,
      skipDuplicates: true,
    });

    return totalSlots;
  }

  /**
   * Returns authoritative derived slot metrics computed directly from database records.
   * NEVER relies on client-provided or unverified numbers.
   */
  static async getAuthoritativeSlotMetrics(matchId: string): Promise<DerivedSlotCounts> {
    // Lazy-clean any expired reservations with payment reconciliation
    await this.cleanupExpiredReservations(matchId);

    const slots = await prisma.slot.findMany({
      where: { matchId },
      select: { status: true },
    });

    const totalSlots = slots.length;
    let availableSlots = 0;
    let reservedSlots = 0;
    let occupiedSlots = 0;

    for (const slot of slots) {
      if (slot.status === SlotStatus.AVAILABLE) availableSlots++;
      else if (slot.status === SlotStatus.OCCUPIED) occupiedSlots++;
      else if (slot.status === SlotStatus.RESERVED || slot.status === SlotStatus.PAYMENT_PENDING) reservedSlots++;
    }

    const fillPercentage = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100) : 0;

    return {
      totalSlots,
      availableSlots,
      reservedSlots,
      occupiedSlots,
      fillPercentage,
    };
  }

  /**
   * Atomically reserves a slot for a user with a 10-minute expiry window.
   * Concurrency Safe: Uses atomic conditional database update.
   */
  static async reserveSlotAtomic(params: {
    matchId: string;
    slotNumber: number;
    userId: string;
    inGameName: string;
    inGameId: string;
    entryFeePaise: number;
  }): Promise<{ success: boolean; slot?: any; joining?: any; error?: string }> {
    const { matchId, slotNumber, userId, inGameName, inGameId, entryFeePaise } = params;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.RESERVATION_WINDOW_MINUTES * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      // 1. Check if user already has an active reservation or joining in this match
      const existingUserJoining = await tx.joining.findFirst({
        where: {
          matchId,
          userId,
          status: { in: [JoiningStatus.CONFIRMED, JoiningStatus.PENDING_PAYMENT] },
        },
      });

      if (existingUserJoining) {
        if (existingUserJoining.status === JoiningStatus.CONFIRMED) {
          return { success: false, error: 'You are already confirmed in this tournament match.' };
        }
        const activeSlot = await tx.slot.findUnique({ where: { id: existingUserJoining.slotId } });
        if (activeSlot && activeSlot.reservationExpiresAt && activeSlot.reservationExpiresAt > now) {
          return {
            success: true,
            slot: activeSlot,
            joining: existingUserJoining,
          };
        }
      }

      // 2. Atomic conditional check on slot
      const slot = await tx.slot.findUnique({
        where: {
          matchId_slotNumber: {
            matchId,
            slotNumber,
          },
        },
      });

      if (!slot) {
        return { success: false, error: 'Slot does not exist.' };
      }

      const isSlotFree =
        slot.status === SlotStatus.AVAILABLE ||
        ((slot.status === SlotStatus.RESERVED || slot.status === SlotStatus.PAYMENT_PENDING) &&
          slot.reservationExpiresAt &&
          slot.reservationExpiresAt < now);

      if (!isSlotFree) {
        return { success: false, error: 'SLOT_UNAVAILABLE' };
      }

      // 3. Atomically claim the slot
      const updatedSlot = await tx.slot.update({
        where: {
          id: slot.id,
          version: slot.version,
        },
        data: {
          status: SlotStatus.RESERVED,
          reservedByUserId: userId,
          reservedAt: now,
          reservationExpiresAt: expiresAt,
          version: { increment: 1 },
        },
      });

      // 4. Create PENDING_PAYMENT Joining record
      const joining = await tx.joining.create({
        data: {
          matchId,
          userId,
          slotId: updatedSlot.id,
          teamNumber: updatedSlot.teamNumber,
          inGameName,
          inGameId,
          status: JoiningStatus.PENDING_PAYMENT,
          amountPaid: entryFeePaise / 100,
        },
      });

      return {
        success: true,
        slot: updatedSlot,
        joining,
      };
    });
  }

  /**
   * Confirms payment: Atomically marks slot as OCCUPIED and joining as CONFIRMED.
   * Idempotent.
   */
  static async confirmJoiningAndOccupySlot(joiningId: string, paymentOrderId: string): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      const joining = await tx.joining.findUnique({
        where: { id: joiningId },
        include: { slot: true },
      });

      if (!joining) return false;

      if (joining.status === JoiningStatus.CONFIRMED && joining.slot.status === SlotStatus.OCCUPIED) {
        return true;
      }

      await tx.slot.update({
        where: { id: joining.slotId },
        data: {
          status: SlotStatus.OCCUPIED,
          reservationExpiresAt: null,
          version: { increment: 1 },
        },
      });

      await tx.joining.update({
        where: { id: joining.id },
        data: {
          status: JoiningStatus.CONFIRMED,
        },
      });

      const occupiedCount = await tx.slot.count({
        where: { matchId: joining.matchId, status: SlotStatus.OCCUPIED },
      });
      await tx.match.update({
        where: { id: joining.matchId },
        data: { filledSlots: occupiedCount },
      });

      return true;
    });
  }

  /**
   * Payment Failure: Releases slot back to AVAILABLE and cancels joining.
   */
  static async releaseSlotOnPaymentFailure(joiningId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const joining = await tx.joining.findUnique({
        where: { id: joiningId },
      });

      if (!joining || joining.status === JoiningStatus.CONFIRMED) {
        return;
      }

      await tx.slot.updateMany({
        where: {
          id: joining.slotId,
          reservedByUserId: joining.userId,
          status: { in: [SlotStatus.RESERVED, SlotStatus.PAYMENT_PENDING] },
        },
        data: {
          status: SlotStatus.AVAILABLE,
          reservedByUserId: null,
          reservedAt: null,
          reservationExpiresAt: null,
          version: { increment: 1 },
        },
      });

      await tx.joining.update({
        where: { id: joining.id },
        data: { status: JoiningStatus.CANCELLED },
      });
    });
  }

  /**
   * Reconciles and safely releases expired reservations.
   * Directives 3 & 4 implementation:
   * 1. Checks payment status with gateway BEFORE releasing a slot (prevents orphaned paid slots).
   * 2. Uses ownership & timestamp constraints (never releases a reassigned slot).
   */
  static async cleanupExpiredReservations(matchId?: string): Promise<number> {
    const now = new Date();
    const where: any = {
      status: { in: [SlotStatus.RESERVED, SlotStatus.PAYMENT_PENDING] },
      reservationExpiresAt: { lt: now },
    };
    if (matchId) where.matchId = matchId;

    const expiredSlots = await prisma.slot.findMany({
      where,
      include: {
        joinings: {
          where: { status: JoiningStatus.PENDING_PAYMENT },
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (expiredSlots.length === 0) return 0;

    let releasedCount = 0;

    for (const slot of expiredSlots) {
      const pendingJoining = slot.joinings[0];
      const pendingPayment = pendingJoining?.payments[0];

      // If there is an active payment order, reconcile with gateway first!
      if (pendingPayment) {
        const reconcileRes = await PaymentReconciliationService.reconcile({
          orderId: pendingPayment.orderId,
          triggerSource: 'RESERVATION_EXPIRY',
        });

        // If gateway revealed payment was actually paid, the slot is now confirmed & occupied!
        if (reconcileRes.paymentStatus === 'SUCCESS') {
          continue;
        }
      }

      // Safe atomic release: Ensure slot has not been modified or reassigned since expiry check
      const updateResult = await prisma.slot.updateMany({
        where: {
          id: slot.id,
          reservedByUserId: slot.reservedByUserId,
          reservationExpiresAt: slot.reservationExpiresAt,
          status: { in: [SlotStatus.RESERVED, SlotStatus.PAYMENT_PENDING] },
        },
        data: {
          status: SlotStatus.AVAILABLE,
          reservedByUserId: null,
          reservedAt: null,
          reservationExpiresAt: null,
          version: { increment: 1 },
        },
      });

      if (updateResult.count > 0) {
        if (pendingJoining) {
          await prisma.joining.update({
            where: { id: pendingJoining.id },
            data: { status: JoiningStatus.CANCELLED },
          });
        }
        releasedCount += updateResult.count;
      }
    }

    return releasedCount;
  }
}
