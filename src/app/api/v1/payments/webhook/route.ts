import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { getPaymentService } from '@/lib/payments';
import { PaymentReconciliationService } from '@/lib/payments/reconciliationService';
import { PaymentAuditService } from '@/lib/audit/paymentAudit';

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  let rawBody = '';

  try {
    rawBody = await request.text();
    const signature =
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-cf-signature') ||
      '';
    const timestamp =
      request.headers.get('x-webhook-timestamp') ||
      request.headers.get('x-cf-timestamp') ||
      '';

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return Api.validationError('Invalid JSON payload in webhook');
    }

    const orderId = payload?.data?.order?.order_id;
    if (!orderId) {
      return Api.validationError('Webhook missing order_id');
    }

    // 1. Audit Log: Webhook received
    await PaymentAuditService.log({
      event: 'WEBHOOK_RECEIVED',
      actorId: 'CASHFREE_GATEWAY',
      entityId: orderId,
      details: { eventType: payload?.type },
      ipAddress,
    });

    // 2. Cryptographic Signature Verification
    const paymentService = getPaymentService();
    try {
      await paymentService.handleWebhook(payload, signature, timestamp, rawBody);
    } catch (sigErr: any) {
      await PaymentAuditService.log({
        event: 'WEBHOOK_REJECTED',
        actorId: 'CASHFREE_GATEWAY',
        entityId: orderId,
        details: { reason: sigErr.message },
        ipAddress,
      });
      return Api.forbidden(`Webhook signature verification failed: ${sigErr.message}`);
    }

    await PaymentAuditService.log({
      event: 'WEBHOOK_VERIFIED',
      actorId: 'CASHFREE_GATEWAY',
      entityId: orderId,
      details: { eventType: payload?.type },
      ipAddress,
    });

    // 3. Mutually Idempotent Reconciliation
    const reconciliation = await PaymentReconciliationService.reconcile({
      orderId,
      triggerSource: 'WEBHOOK',
      rawPayload: payload,
      ipAddress,
    });

    return Api.success({
      success: true,
      orderId,
      paymentStatus: reconciliation.paymentStatus,
      alreadySettled: reconciliation.alreadySettled ?? false,
      message: 'Webhook processed successfully.',
    });
  } catch (error: any) {
    console.error('[WEBHOOK_ERROR]', error);
    return Api.serverError('Webhook processing error', error.message);
  }
}
