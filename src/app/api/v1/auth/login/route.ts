import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { ErrorCodes } from '@/lib/api/errors';
import { PasswordService } from '@/lib/auth/password';
import { JwtService } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Api.validationError('Invalid request payload. Expected JSON.');
    }

    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string' || !password || typeof password !== 'string') {
      return Api.validationError('Both identifier (email or username) and password are required.');
    }

    const trimmedIdentifier = identifier.trim().toLowerCase();

    // Look up user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedIdentifier },
          { username: trimmedIdentifier },
        ],
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return Api.unauthorized('Invalid email/username or password.');
    }

    // Verify password hash
    const isValid = await PasswordService.verify(password, user.passwordHash);
    if (!isValid) {
      return Api.unauthorized('Invalid email/username or password.');
    }

    // Check account status
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return Api.forbidden('This account has been suspended or banned. Please contact Void X Arena support.');
    }

    // Generate tokens
    const { token: accessToken, expiresInSeconds } = JwtService.generateAccessToken({
      userId: user.id,
      role: user.role,
      username: user.username,
      gameUid: user.gameUid,
    });

    const { token: refreshToken, expiresAt } = JwtService.generateRefreshToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    // Save refresh token record
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
        deviceInfo: request.headers.get('user-agent') || 'Mobile Client',
      },
    });

    return Api.success({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        gameUid: user.gameUid,
        gameName: user.gameName,
        wallet: {
          balance: Number(user.wallet?.balance || 0),
          winningBalance: Number(user.wallet?.winningBalance || 0),
        },
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresInSeconds,
        tokenType: 'Bearer',
      },
    });
  } catch (error: any) {
    return Api.serverError('Login failed due to a server error', error.message);
  }
}
