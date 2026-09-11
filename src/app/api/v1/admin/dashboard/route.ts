import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminDashboardService } from '@/lib/admin/adminDashboardService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const summary = await AdminDashboardService.getOperationalSummary();
    return Api.success(summary);
  } catch (error: any) {
    return Api.serverError('Failed to fetch admin dashboard summary', error.message);
  }
}
