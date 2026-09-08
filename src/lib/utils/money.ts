/**
 * Enterprise-grade Money & Currency Precision Utility.
 * Operates strictly in integer minor units (paise for INR) to eliminate
 * IEEE-754 floating point arithmetic precision drift.
 * 
 * ₹1.00 = 100 paise.
 * ₹50.25 = 5025 paise.
 */

export class Money {
  /**
   * Converts INR amount (number, string, or Decimal) to integer paise.
   * e.g., 50.25 -> 5025
   */
  static toPaise(amountInRupees: number | string): number {
    const num = typeof amountInRupees === 'string' ? parseFloat(amountInRupees) : amountInRupees;
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }

  /**
   * Converts integer paise back to decimal rupees with exact 2 decimal places.
   * e.g., 5025 -> 50.25
   */
  static toRupees(paise: number): number {
    return paise / 100;
  }

  /**
   * Formats paise as human-readable INR string.
   * e.g., 5025 -> "₹50.25"
   */
  static format(paise: number): string {
    return `₹${(paise / 100).toFixed(2)}`;
  }

  /**
   * Exact integer addition
   */
  static add(paiseA: number, paiseB: number): number {
    return Math.trunc(paiseA) + Math.trunc(paiseB);
  }

  /**
   * Exact integer subtraction (ensures no negative unless allowed)
   */
  static subtract(paiseA: number, paiseB: number, allowNegative = false): number {
    const diff = Math.trunc(paiseA) - Math.trunc(paiseB);
    if (!allowNegative && diff < 0) {
      throw new Error(`Insufficient funds: cannot subtract ${paiseB} from ${paiseA} paise`);
    }
    return diff;
  }

  /**
   * Safe multiplication by a factor with rounding to nearest paise
   */
  static multiply(paise: number, factor: number): number {
    return Math.round(paise * factor);
  }

  /**
   * Divides paise among N recipients without losing pennies.
   * Returns an array of paise whose sum exactly equals the input paise.
   */
  static split(totalPaise: number, parts: number): number[] {
    if (parts <= 0) throw new Error('Parts must be greater than zero');
    const base = Math.floor(totalPaise / parts);
    const remainder = totalPaise % parts;
    const result = new Array(parts).fill(base);
    for (let i = 0; i < remainder; i++) {
      result[i] += 1;
    }
    return result;
  }
}
