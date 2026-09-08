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

    const wallet = await WalletService.getWallet(user.userId);
    return Api.success(wallet);
  } catch (error: any) {
    return Api.serverError('Failed to fetch wallet', error.message);
  }
}
