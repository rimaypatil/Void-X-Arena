import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { ErrorCodes } from '@/lib/api/errors';
import { prisma } from '@/lib/db/prisma';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { getPaymentService } from '@/lib/payments';
import { PaymentAuditService } from '@/lib/audit/paymentAudit';
import { SlotService } from '@/lib/tournament/slotService';
import { Money } from '@/lib/utils/money';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { user: authUser, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !authUser) {
      return errorResponse;
    }

    // 2. Verify account is ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, email: true, phone: true, status: true, username: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return Api.forbidden('Account is not eligible to make tournament payments.', ErrorCodes.ACCOUNT_SUSPENDED);
    }

    const body = await request.json().catch(() => null);
    const { matchId, slotId, joiningId } = body || {};

    let targetJoining: any = null;

    if (joiningId) {
      targetJoining = await prisma.joining.findUnique({
        where: { id: joiningId },
        include: { match: true, slot: true },
      });
    } else if (matchId && slotId) {
      targetJoining = await prisma.joining.findFirst({
        where: {
          matchId,
          slotId,
          userId: authUser.userId,
          status: 'PENDING_PAYMENT',
        },
        include: { match: true, slot: true },
      });
    }

    if (!targetJoining || targetJoining.userId !== authUser.userId) {
      return Api.notFound('Active slot reservation not found. Please reserve a slot first.');
    }

    const match = targetJoining.match;
    const slot = targetJoining.slot;

    // 3. Verify match state & registration window
    if (match.status !== 'UPCOMING') {
      return Api.error(
        ErrorCodes.REGISTRATION_CLOSED,
        `Tournament registration is closed (match is ${match.status.toLowerCase()}).`
      );
    }

    const now = new Date();
    if (match.registrationEnd && match.registrationEnd < now) {
      return Api.error(ErrorCodes.REGISTRATION_CLOSED, 'Tournament registration window has ended.');
    }

    // 4. Verify slot state and reservation validity
    if (slot.status !== 'RESERVED' && slot.status !== 'PAYMENT_PENDING') {
      return Api.error(
        ErrorCodes.SLOT_UNAVAILABLE,
        'Slot reservation has expired or is occupied. Please select another slot.'
      );
    }

    if (slot.reservationExpiresAt && slot.reservationExpiresAt < now) {
      return Api.error(
        ErrorCodes.SLOT_UNAVAILABLE,
        'Slot reservation has timed out. Please re-select your slot.'
      );
    }

    // 5. SERVER-AUTHORITATIVE AMOUNT: Read directly from database match.entryFee
    // Client NEVER supplies the authoritative amount
    const entryFeePaise = Money.toPaise(Number(match.entryFee));
    const entryFeeRupees = Money.toRupees(entryFeePaise);

    // 6. Check for existing active payment order to prevent duplicate orders
    const existingPayment = await prisma.payment.findFirst({
      where: {
        joiningId: targetJoining.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    const paymentService = getPaymentService();

    if (existingPayment) {
      // Re-use active gateway order session if still within window
      const timeDiffMinutes = (now.getTime() - existingPayment.createdAt.getTime()) / (1000 * 60);
      if (timeDiffMinutes < 8) {
        return Api.success({
          orderId: existingPayment.orderId,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
          gatewayName: existingPayment.gatewayName,
          checkoutUrl: `/arena/payments/checkout?order_id=${existingPayment.orderId}`,
        });
      }
    }

    // 7. Generate unique gateway order identifier & idempotency key
    const orderId = `VXA_${match.contestId}_${slot.slotNumber}_${Date.now()}`;
    const idempotencyKey = `idemp_order_${targetJoining.id}_${orderId}`;

    let orderResult;
    try {
      orderResult = await paymentService.createOrder({
        orderId,
        amount: entryFeeRupees,
        currency: 'INR',
        customer: {
          id: authUser.userId,
          email: user.email,
          phone: user.phone || '9999999999',
          name: targetJoining.inGameName || user.username,
        },
        notes: {
          matchId: match.id,
          contestId: match.contestId,
          slotId: slot.id,
          slotNumber: String(slot.slotNumber),
          joiningId: targetJoining.id,
        },
      });
    } catch (gatewayErr: any) {
      console.error(`[PAYMENT_GATEWAY_ERROR] Failed to create Cashfree order:`, gatewayErr.message);
      return Api.serverError('Payment gateway communication error. Please try again.');
    }

    // 8. Save payment record in PENDING state
    await prisma.payment.create({
      data: {
        orderId,
        userId: authUser.userId,
        joiningId: targetJoining.id,
        referenceType: 'MATCH_JOINING',
        referenceId: match.id,
        amount: entryFeeRupees,
        currency: 'INR',
        status: 'PENDING',
        gatewayName: orderResult.gatewayName,
        idempotencyKey,
      },
    });

    await PaymentAuditService.log({
      event: 'ORDER_CREATED',
      actorId: authUser.userId,
      entityId: orderId,
      details: {
        amount: entryFeeRupees,
        contestId: match.contestId,
        slotNumber: slot.slotNumber,
      },
    });

    // 9. Return only safe client-facing parameters
    return Api.success({
      orderId: orderResult.orderId,
      paymentSessionId: orderResult.paymentSessionId,
      amount: orderResult.orderAmount,
      currency: orderResult.orderCurrency,
      checkoutUrl: orderResult.checkoutUrl,
      gatewayName: orderResult.gatewayName,
    });
  } catch (error: any) {
    return Api.serverError('Failed to initialize tournament payment order', error.message);
  }
}
