import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminUserService } from '@/lib/admin/adminUserService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body.amountDelta !== 'number' || !body.reason) {
      return Api.badRequest('Required fields: "amountDelta" (numeric: positive or negative) and "reason" (string).');
    }

    const transaction = await AdminUserService.adjustWallet({
      userId: params.id,
      amountDelta: body.amountDelta,
      reason: body.reason,
      adminUserId: user.userId,
    });

    return Api.success({
      message: 'Compensating wallet adjustment recorded in immutable ledger.',
      transaction,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
