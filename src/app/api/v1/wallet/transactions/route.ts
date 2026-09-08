import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { WalletService } from '@/lib/wallet/walletService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !user) {
      return errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') || 'ALL') as any;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await WalletService.getTransactions({
      userId: user.userId,
      filter,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : Math.min(limit, 100),
    });

    return Api.success(data);
  } catch (error: any) {
    return Api.serverError('Failed to fetch wallet transactions', error.message);
  }
}
