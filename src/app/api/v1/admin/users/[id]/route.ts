import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminUserService } from '@/lib/admin/adminUserService';
import { UserStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const userDetail = await AdminUserService.getUserDetail(params.id);
    return Api.success(userDetail);
  } catch (error: any) {
    return Api.notFound(error.message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.status || !body.reason) {
      return Api.badRequest('Both "status" (ACTIVE, SUSPENDED, BANNED) and "reason" are required.');
    }

    const allowed = Object.values(UserStatus);
    if (!allowed.includes(body.status)) {
      return Api.badRequest(`Invalid user status. Allowed: ${allowed.join(', ')}`);
    }

    const updated = await AdminUserService.updateUserStatus({
      userId: params.id,
      status: body.status,
      reason: body.reason,
      adminUserId: user.userId,
    });

    return Api.success({ message: `User status changed to ${body.status}.`, user: updated });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
