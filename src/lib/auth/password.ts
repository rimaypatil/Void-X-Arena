import crypto from 'crypto';

/**
 * Enterprise-grade password hashing utilities.
 * Uses SHA-512 PBKDF2 with unique cryptographic per-user salt and 100,000 iterations.
 * Format: pbkdf2$100000$<salt_hex>$<hash_hex>
 */
export class PasswordService {
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LEN = 64;
  private static readonly DIGEST = 'sha512';

  static async hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(
        password,
        salt,
        this.ITERATIONS,
        this.KEY_LEN,
        this.DIGEST,
        (err, derivedKey) => {
          if (err) return reject(err);
          resolve(`pbkdf2$${this.ITERATIONS}$${salt}$${derivedKey.toString('hex')}`);
        }
      );
    });
  }

  static async verify(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const parts = storedHash.split('$');
        if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
          return resolve(false);
        }

        const iterations = parseInt(parts[1], 10);
        const salt = parts[2];
        const hash = parts[3];

        crypto.pbkdf2(
          password,
          salt,
          iterations,
          this.KEY_LEN,
          this.DIGEST,
          (err, derivedKey) => {
            if (err) return resolve(false);
            const derivedHex = derivedKey.toString('hex');
            // Timing-safe buffer comparison to prevent timing attacks
            const a = Buffer.from(derivedHex, 'hex');
            const b = Buffer.from(hash, 'hex');
            if (a.length !== b.length) return resolve(false);
            resolve(crypto.timingSafeEqual(a, b));
          }
        );
      } catch {
        resolve(false);
      }
    });
  }
}
