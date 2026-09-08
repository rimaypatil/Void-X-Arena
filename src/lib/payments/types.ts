export type PaymentGatewayType = 'CASHFREE' | 'SIMULATOR';

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  customer: {
    id: string;
    email: string;
    phone: string;
    name?: string;
  };
  notes?: Record<string, string>;
  returnUrl?: string;
}

export interface PaymentOrderResult {
  orderId: string;
  paymentSessionId: string;
  orderStatus: 'ACTIVE' | 'PAID' | 'EXPIRED';
  orderAmount: number;
  orderCurrency: string;
  gatewayName: PaymentGatewayType;
  checkoutUrl?: string;
}

export interface PaymentVerificationResult {
  orderId: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'USER_DROPPED';
  referenceId?: string;
  paymentMethod?: string;
  amount: number;
  paidAt?: Date;
  rawResponse?: unknown;
}

export interface WebhookEventPayload {
  event: 'PAYMENT_SUCCESS_WEBHOOK' | 'PAYMENT_FAILED_WEBHOOK' | 'PAYMENT_USER_DROPPED_WEBHOOK';
  orderId: string;
  referenceId: string;
  paymentAmount: number;
  paymentCurrency: string;
  signature: string;
  raw: unknown;
}

export interface RefundParams {
  orderId: string;
  refundAmount: number;
  refundId: string;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  status: 'REFUND_PENDING' | 'REFUNDED' | 'REFUND_FAILED';
  gatewayRefundId?: string;
  processedAt?: Date;
}

export interface PaymentService {
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(orderId: string): Promise<PaymentVerificationResult>;
  getPaymentStatus(orderId: string): Promise<PaymentVerificationResult>;
  handleWebhook(payload: unknown, signature?: string, timestamp?: string, rawBody?: string): Promise<WebhookEventPayload>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
}
