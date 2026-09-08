import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { ErrorCodes } from '@/lib/api/errors';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { PaymentReconciliationService } from '@/lib/payments/reconciliationService';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { user: authUser, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !authUser) {
      return errorResponse;
    }

    const body = await request.json().catch(() => null);
    const orderId = body?.orderId;

    if (!orderId || typeof orderId !== 'string') {
      return Api.validationError('orderId is required.');
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    // 2. Delegate to the mutually idempotent reconciliation engine
    const result = await PaymentReconciliationService.reconcile({
      orderId,
      actorId: authUser.userId,
      triggerSource: 'VERIFY_ENDPOINT',
      ipAddress,
    });

    if (!result.success) {
      return Api.error(
        ErrorCodes.PAYMENT_FAILED,
        result.error || 'Payment verification failed.',
        { orderId, status: result.paymentStatus },
        400
      );
    }

    return Api.success({
      orderId: result.orderId,
      paymentStatus: result.paymentStatus,
      joiningStatus: result.joiningStatus,
      alreadySettled: result.alreadySettled ?? false,
      referenceId: result.referenceId,
      message:
        result.paymentStatus === 'SUCCESS'
          ? 'Payment and slot confirmed.'
          : 'Payment verification in progress.',
    });
  } catch (error: any) {
    return Api.serverError('Payment verification failed', error.message);
  }
}
