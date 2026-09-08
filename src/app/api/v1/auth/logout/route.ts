import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { AuthMiddleware } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticate(request);
    const body = await request.json().catch(() => null);
    const refreshToken = body?.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    } else if (user) {
      // If no specific refresh token provided, revoke all active sessions for this user on logout
      await prisma.refreshToken.updateMany({
        where: { userId: user.userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return Api.success({ message: 'Logged out successfully.' });
  } catch (error: any) {
    return Api.serverError('Logout failed', error.message);
  }
}
