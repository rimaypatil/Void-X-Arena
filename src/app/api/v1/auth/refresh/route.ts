import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { ErrorCodes } from '@/lib/api/errors';
import { JwtService } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const refreshToken = body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return Api.validationError('Refresh token is required.');
    }

    // Verify token signature and expiration
    const payload = JwtService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return Api.unauthorized('Invalid or expired refresh token. Please sign in again.');
    }

    // Look up token in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      return Api.unauthorized('Refresh token has been revoked or expired. Please sign in again.');
    }

    if (tokenRecord.user.status === 'BANNED' || tokenRecord.user.status === 'SUSPENDED') {
      return Api.forbidden('Account has been suspended.');
    }

    // Token rotation: Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Generate fresh tokens
    const { token: newAccessToken, expiresInSeconds } = JwtService.generateAccessToken({
      userId: tokenRecord.user.id,
      role: tokenRecord.user.role,
      username: tokenRecord.user.username,
      gameUid: tokenRecord.user.gameUid,
    });

    const { token: newRefreshToken, expiresAt } = JwtService.generateRefreshToken({
      userId: tokenRecord.user.id,
      role: tokenRecord.user.role,
      username: tokenRecord.user.username,
    });

    // Save new refresh token record
    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        token: newRefreshToken,
        expiresAt,
        deviceInfo: request.headers.get('user-agent') || 'Mobile Client',
      },
    });

    return Api.success({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresInSeconds,
        tokenType: 'Bearer',
      },
    });
  } catch (error: any) {
    return Api.serverError('Token refresh failed', error.message);
  }
}
