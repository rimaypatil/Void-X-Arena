import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { AuthMiddleware } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !authUser) {
      return errorResponse;
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        wallet: true,
        _count: {
          select: {
            joinings: { where: { status: 'CONFIRMED' } },
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      return Api.unauthorized('User not found.');
    }

    return Api.success({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        gameUid: user.gameUid,
        gameName: user.gameName,
        wallet: {
          balance: Number(user.wallet?.balance || 0),
          winningBalance: Number(user.wallet?.winningBalance || 0),
          depositBalance: Number(user.wallet?.depositBalance || 0),
          bonusBalance: Number(user.wallet?.bonusBalance || 0),
          currency: user.wallet?.currency || 'INR',
        },
        stats: {
          confirmedMatchesCount: user._count.joinings,
          unreadNotificationsCount: user._count.notifications,
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch profile', error.message);
  }
}
