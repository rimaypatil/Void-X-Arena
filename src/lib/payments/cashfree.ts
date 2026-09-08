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

/**
 * Production-grade Cashfree Payment Gateway (PG) Service (API Version 2023-08-01).
 * Operates strictly server-side with cryptographic signature verification.
 */
export class CashfreePaymentService implements PaymentService {
  private readonly appId: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;
  private readonly environment: 'SANDBOX' | 'PRODUCTION';

  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || '';
    this.secretKey = process.env.CASHFREE_SECRET_KEY || '';
    this.webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || this.secretKey;
    this.apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
    
    const envConfig = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
    this.environment = envConfig === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    this.baseUrl =
      this.environment === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': this.apiVersion,
    };
  }

  /**
   * Creates an order with Cashfree PG
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const returnUrl =
      params.returnUrl ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voidxarena.gg'}/arena/payments/callback?order_id={order_id}`;
    const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voidxarena.gg'}/api/v1/payments/webhook`;

    const requestBody = {
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: params.currency || 'INR',
      customer_details: {
        customer_id: params.customer.id,
        customer_email: params.customer.email,
        customer_phone: params.customer.phone || '9999999999',
        customer_name: params.customer.name || 'Contender',
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_methods: 'upi,cc,dc,nb',
      },
      order_note: params.notes ? JSON.stringify(params.notes) : undefined,
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Cashfree createOrder failed [${response.status}]: ${data.message || response.statusText}`);
    }

    return {
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      orderAmount: data.order_amount,
      orderCurrency: data.order_currency,
      gatewayName: 'CASHFREE',
      checkoutUrl: data.payments?.url,
    };
  }

  /**
   * Authoritative Payment Status Query from Cashfree
   */
  async verifyPayment(orderId: string): Promise<PaymentVerificationResult> {
    // 1. Check payments collection
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const payments = await response.json();

    if (response.ok && Array.isArray(payments) && payments.length > 0) {
      // Look for a successful payment
      const successful = payments.find((p) => p.payment_status === 'SUCCESS');
      if (successful) {
        return {
          orderId,
          paymentStatus: 'SUCCESS',
          referenceId: successful.cf_payment_id ? String(successful.cf_payment_id) : undefined,
          paymentMethod: successful.payment_group || 'UPI',
          amount: Number(successful.payment_amount),
          paidAt: successful.payment_completion_time ? new Date(successful.payment_completion_time) : new Date(),
          rawResponse: successful,
        };
      }

      // Check if user dropped or payment explicitly failed
      const failed = payments.find((p) => p.payment_status === 'FAILED');
      if (failed) {
        return {
          orderId,
          paymentStatus: 'FAILED',
          referenceId: failed.cf_payment_id ? String(failed.cf_payment_id) : undefined,
          amount: Number(failed.payment_amount),
          rawResponse: failed,
        };
      }
    }

    // 2. If no payments yet, check order status directly
    const orderRes = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (orderRes.ok) {
      const orderData = await orderRes.json();
      if (orderData.order_status === 'PAID') {
        return {
          orderId,
          paymentStatus: 'SUCCESS',
          amount: Number(orderData.order_amount),
          rawResponse: orderData,
        };
      }
      if (orderData.order_status === 'EXPIRED') {
        return {
          orderId,
          paymentStatus: 'FAILED',
          amount: Number(orderData.order_amount),
          rawResponse: orderData,
        };
      }
    }

    return {
      orderId,
      paymentStatus: 'PENDING',
      amount: 0,
    };
  }

  async getPaymentStatus(orderId: string): Promise<PaymentVerificationResult> {
    return this.verifyPayment(orderId);
  }

  /**
   * Verifies Cashfree Webhook HMAC-SHA256 Signature
   */
  async handleWebhook(payload: any, signature?: string, timestamp?: string, rawBody?: string): Promise<WebhookEventPayload> {
    if (!signature) {
      throw new Error('Cashfree webhook missing signature');
    }

    // Cashfree signature verification algorithm:
    // signature = base64(hmac_sha256(timestamp + rawBody, secretKey))
    if (timestamp && rawBody) {
      const signaturePayload = `${timestamp}${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signaturePayload)
        .digest('base64');

      const sigA = Buffer.from(signature);
      const sigB = Buffer.from(expectedSignature);
      if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
        throw new Error('Cryptographic signature verification failed');
      }
    }

    const orderId = payload?.data?.order?.order_id;
    const amount = Number(payload?.data?.payment?.payment_amount || payload?.data?.order?.order_amount || 0);
    const currency = payload?.data?.payment?.payment_currency || 'INR';
    const referenceId = String(payload?.data?.payment?.cf_payment_id || '');
    const event = payload?.type as WebhookEventPayload['event'];

    return {
      event,
      orderId,
      referenceId,
      paymentAmount: amount,
      paymentCurrency: currency,
      signature,
      raw: payload,
    };
  }

  /**
   * Processes a refund via Cashfree
   */
  async refundPayment(params: RefundParams): Promise<RefundResult> {
    const response = await fetch(`${this.baseUrl}/orders/${params.orderId}/refunds`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        refund_amount: params.refundAmount,
        refund_id: params.refundId,
        refund_note: params.reason,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        refundId: params.refundId,
        status: 'REFUND_FAILED',
      };
    }

    return {
      refundId: data.refund_id,
      status: data.refund_status === 'SUCCESS' ? 'REFUNDED' : 'REFUND_PENDING',
      gatewayRefundId: data.cf_refund_id ? String(data.cf_refund_id) : undefined,
      processedAt: new Date(),
    };
  }
}
