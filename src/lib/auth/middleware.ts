import { NextRequest } from 'next/server';
import { JwtService, TokenPayload } from './jwt';
import { Api } from '../api/response';
import { ErrorCodes } from '../api/errors';

export interface AuthenticatedUser {
  userId: string;
  role: 'USER' | 'ADMIN';
  username: string;
  gameUid?: string | null;
}

export class AuthMiddleware {
  /**
   * Extracts the Bearer token from the Authorization header or session cookie
   */
  static extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // Cookie fallback for web browser
    const cookieToken = request.cookies.get('vxa_access_token')?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  /**
   * Authorizes any valid authenticated user
   */
  static async authenticate(request: NextRequest): Promise<{ user: AuthenticatedUser | null; errorResponse?: ReturnType<typeof Api.unauthorized> }> {
    const token = this.extractToken(request);
    if (!token) {
      return {
        user: null,
        errorResponse: Api.unauthorized('Authentication token missing. Please log in.'),
      };
    }

    const payload = JwtService.verifyAccessToken(token);
    if (!payload) {
      return {
        user: null,
        errorResponse: Api.error(ErrorCodes.SESSION_EXPIRED, 'Session expired or invalid token. Please refresh credentials.', undefined, 401),
      };
    }

    return {
      user: {
        userId: payload.userId,
        role: payload.role,
        username: payload.username,
        gameUid: payload.gameUid,
      },
    };
  }

  /**
   * Enforces administrator privileges
   */
  static async requireAdmin(request: NextRequest): Promise<{ user: AuthenticatedUser | null; errorResponse?: ReturnType<typeof Api.forbidden> }> {
    const { user, errorResponse } = await this.authenticate(request);
    if (errorResponse || !user) {
      return { user: null, errorResponse: errorResponse as any };
    }

    if (user.role !== 'ADMIN') {
      return {
        user: null,
        errorResponse: Api.forbidden('Administrative privileges required for this operation.'),
      };
    }

    return { user };
  }
}
