import crypto from 'crypto';
import {
  CreateOrderParams,
  PaymentOrderResult,
  PaymentService,
  PaymentVerificationResult,
  RefundParams,
  RefundResult,
  WebhookEventPayload,
} from './types';

interface SimulatedOrderState {
  orderId: string;
  amount: number;
  currency: string;
  customer: CreateOrderParams['customer'];
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'USER_DROPPED';
  referenceId: string;
  createdAt: Date;
  paidAt?: Date;
}

/**
 * Strict Asynchronous Development Payment Gateway Simulator.
 * Simulates real-world Cashfree payment lifecycles:
 * - Order creation leaves order strictly in PENDING.
 * - Requires real asynchronous webhook simulation or verification poll.
 * - Uses real HMAC-SHA256 signatures for webhook verification.
 * - NEVER auto-resolves to SUCCESS immediately.
 */
export class DevPaymentSimulator implements PaymentService {
  private static orders = new Map<string, SimulatedOrderState>();
  private readonly secretKey: string;

  constructor(secretKey = 'sim_secret_key_vxa_dev_2026') {
    this.secretKey = secretKey;
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const referenceId = `sim_cf_ref_${crypto.randomBytes(6).toString('hex')}`;
    const paymentSessionId = `sim_session_${crypto.randomBytes(12).toString('hex')}`;

    // Order begins strictly in PENDING state
    DevPaymentSimulator.orders.set(params.orderId, {
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      customer: params.customer,
      status: 'PENDING',
      referenceId,
      createdAt: new Date(),
    });

    return {
      orderId: params.orderId,
      paymentSessionId,
      orderStatus: 'ACTIVE',
      orderAmount: params.amount,
      orderCurrency: params.currency,
      gatewayName: 'SIMULATOR',
      checkoutUrl: `/arena/payments/checkout?order_id=${params.orderId}&session_id=${paymentSessionId}`,
    };
  }

  async verifyPayment(orderId: string): Promise<PaymentVerificationResult> {
    const order = DevPaymentSimulator.orders.get(orderId);
    if (!order) {
      return {
        orderId,
        paymentStatus: 'FAILED',
        amount: 0,
      };
    }

    return {
      orderId: order.orderId,
      paymentStatus: order.status,
      referenceId: order.referenceId,
      paymentMethod: 'UPI',
      amount: order.amount,
      paidAt: order.paidAt,
      rawResponse: { simulated: true, order },
    };
  }

  async getPaymentStatus(orderId: string): Promise<PaymentVerificationResult> {
    return this.verifyPayment(orderId);
  }

  /**
   * Generates a signed webhook payload simulating Cashfree gateway asynchronous callbacks
   */
  generateSimulatedWebhook(orderId: string, outcome: 'SUCCESS' | 'FAILED'): { payload: any; signature: string } {
    const order = DevPaymentSimulator.orders.get(orderId);
    if (!order) {
      throw new Error(`Simulated order ${orderId} not found`);
    }

    order.status = outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
    if (outcome === 'SUCCESS') {
      order.paidAt = new Date();
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = {
      data: {
        order: {
          order_id: order.orderId,
          order_amount: order.amount,
          order_currency: order.currency,
        },
        payment: {
          cf_payment_id: order.referenceId,
          payment_status: outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
          payment_amount: order.amount,
          payment_currency: order.currency,
          payment_message: outcome === 'SUCCESS' ? 'Payment processed successfully' : 'Payment failed by user',
          payment_time: new Date().toISOString(),
          payment_method: {
            upi: {
              channel: 'upi_intent',
              upi_id: 'player@okaxis',
            },
          },
        },
      },
      event_time: new Date().toISOString(),
      type: outcome === 'SUCCESS' ? 'PAYMENT_SUCCESS_WEBHOOK' : 'PAYMENT_FAILED_WEBHOOK',
    };

    const signatureRaw = `${timestamp}${JSON.stringify(payload)}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureRaw)
      .digest('base64');

    return { payload, signature };
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookEventPayload> {
    const orderId = payload?.data?.order?.order_id;
    const amount = Number(payload?.data?.payment?.payment_amount || 0);
    const currency = payload?.data?.payment?.payment_currency || 'INR';
    const referenceId = String(payload?.data?.payment?.cf_payment_id || '');
    const event = payload?.type as WebhookEventPayload['event'];

    return {
      event,
      orderId,
      referenceId,
      paymentAmount: amount,
      paymentCurrency: currency,
      signature: signature || '',
      raw: payload,
    };
  }

  async refundPayment(params: RefundParams): Promise<RefundResult> {
    return {
      refundId: params.refundId,
      status: 'REFUNDED',
      gatewayRefundId: `sim_rf_${crypto.randomBytes(6).toString('hex')}`,
      processedAt: new Date(),
    };
  }
}
