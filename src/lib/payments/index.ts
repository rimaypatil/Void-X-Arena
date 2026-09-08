import { DevPaymentSimulator } from './simulator';
import { CashfreePaymentService } from './cashfree';
import { PaymentService } from './types';

export * from './types';
export * from './simulator';
export * from './cashfree';

let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (paymentServiceInstance) {
    return paymentServiceInstance;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const provider = (process.env.PAYMENT_PROVIDER || 'cashfree').toLowerCase();

  // CRITICAL PRODUCTION SAFETY GUARD:
  // DevPaymentSimulator is strictly forbidden in production environments
  if (isProduction && provider === 'dev') {
    throw new Error(
      'CRITICAL SECURITY ERROR: DevPaymentSimulator cannot be enabled in a production environment. Use CashfreePaymentService.'
    );
  }

  if (provider === 'dev') {
    paymentServiceInstance = new DevPaymentSimulator(
      process.env.CASHFREE_WEBHOOK_SECRET || 'sim_secret_key_vxa_dev_2026'
    );
  } else {
    // Default to Cashfree (Sandbox or Production based on CASHFREE_ENV)
    paymentServiceInstance = new CashfreePaymentService();
  }

  return paymentServiceInstance;
}
