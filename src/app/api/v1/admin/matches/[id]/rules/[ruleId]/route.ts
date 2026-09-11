import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminRuleService } from '@/lib/tournament/adminRuleService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body) return Api.badRequest('Invalid JSON.');

    const updated = await AdminRuleService.updateRule({
      ruleId: params.ruleId,
      ruleText: body.ruleText,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
      adminUserId: user.userId,
    });

    return Api.success({ message: 'Rule updated.', rule: updated });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    await AdminRuleService.deleteRule(params.ruleId, user.userId);
    return Api.success({ message: 'Rule deleted.' });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
