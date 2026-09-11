import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminRuleService } from '@/lib/tournament/adminRuleService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.ruleText) {
      return Api.badRequest('Field "ruleText" is required.');
    }

    const rule = await AdminRuleService.addRule({
      matchId: params.id,
      ruleText: body.ruleText,
      displayOrder: body.displayOrder,
      adminUserId: user.userId,
    });

    return Api.created({
      message: 'Match rule created.',
      rule,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
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
    if (!body || !Array.isArray(body.ruleIdsInOrder)) {
      return Api.badRequest('Field "ruleIdsInOrder" (array of string IDs) is required.');
    }

    await AdminRuleService.reorderRules(params.id, body.ruleIdsInOrder, user.userId);
    return Api.success({ message: 'Rules reordered successfully.' });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
