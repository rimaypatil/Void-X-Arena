import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
  username: string;
  gameUid?: string | null;
  type: 'access' | 'refresh';
  exp: number;
  iat: number;
}

export class JwtService {
  private static getAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET || 'fallback_vxa_dev_access_secret_do_not_use_in_prod';
  }

  private static getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'fallback_vxa_dev_refresh_secret_do_not_use_in_prod';
  }

  private static base64UrlEncode(str: string | Buffer): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private static base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64').toString('utf8');
  }

  private static sign(header: object, payload: object, secret: string): string {
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest();
    return `${data}.${this.base64UrlEncode(signature)}`;
  }

  private static verifyToken(token: string, secret: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;
      const data = `${headerB64}.${payloadB64}`;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest();
      const expectedSignatureB64 = this.base64UrlEncode(expectedSignature);

      // Constant-time compare
      const sigA = Buffer.from(signatureB64);
      const sigB = Buffer.from(expectedSignatureB64);
      if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(payloadB64)) as TokenPayload;
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generates a short-lived access token (default 15 minutes = 900 seconds)
   */
  static generateAccessToken(params: {
    userId: string;
    role: 'USER' | 'ADMIN';
    username: string;
    gameUid?: string | null;
  }): { token: string; expiresInSeconds: number } {
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = 900; // 15m
    const payload: TokenPayload = {
      ...params,
      type: 'access',
      iat: now,
      exp: now + expiresInSeconds,
    };

    const token = this.sign({ alg: 'HS256', typ: 'JWT' }, payload, this.getAccessSecret());
    return { token, expiresInSeconds };
  }

  /**
   * Generates a cryptographically random refresh token paired with an expiration timestamp
   */
  static generateRefreshToken(params: {
    userId: string;
    role: 'USER' | 'ADMIN';
    username: string;
  }): { token: string; expiresAt: Date } {
    const now = Math.floor(Date.now() / 1000);
    const expiresInDays = 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const payload: TokenPayload = {
      ...params,
      type: 'refresh',
      iat: now,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = this.sign({ alg: 'HS256', typ: 'JWT' }, payload, this.getRefreshSecret());
    return { token, expiresAt };
  }

  /**
   * Validates an access token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    const payload = this.verifyToken(token, this.getAccessSecret());
    if (!payload || payload.type !== 'access') return null;
    return payload;
  }

  /**
   * Validates a refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload | null {
    const payload = this.verifyToken(token, this.getRefreshSecret());
    if (!payload || payload.type !== 'refresh') return null;
    return payload;
  }
}
