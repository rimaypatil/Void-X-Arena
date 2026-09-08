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

    const { email, username, password, fullName, phone, gameUid, gameName } = body;

    // Strict validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Api.validationError('A valid email address is required.');
    }

    if (!username || typeof username !== 'string' || username.length < 3) {
      return Api.validationError('Username must be at least 3 alphanumeric characters.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return Api.validationError('Password must be at least 6 characters long.');
    }

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { username: username.trim() },
          ...(phone ? [{ phone: phone.trim() }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === email.toLowerCase().trim()) {
        return Api.error(ErrorCodes.VALIDATION_ERROR, 'An account with this email already exists.');
      }
      if (existing.username.toLowerCase() === username.trim().toLowerCase()) {
        return Api.error(ErrorCodes.VALIDATION_ERROR, 'This username is already taken. Please choose another.');
      }
      return Api.error(ErrorCodes.VALIDATION_ERROR, 'Phone number is already associated with another account.');
    }

    // Securely hash password
    const passwordHash = await PasswordService.hash(password);

    // Create user and initialize wallet atomically
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username.trim(),
        fullName: fullName?.trim() || null,
        phone: phone?.trim() || null,
        passwordHash,
        role: 'USER', // Strictly non-privileged
        status: 'ACTIVE',
        gameUid: gameUid?.trim() || null,
        gameName: gameName?.trim() || null,
        wallet: {
          create: {
            balance: 0,
            winningBalance: 0,
            depositBalance: 0,
            bonusBalance: 0,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

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

    return Api.success(
      {
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
      },
      undefined,
      201
    );
  } catch (error: any) {
    return Api.serverError('Registration failed due to a server error', error.message);
  }
}
