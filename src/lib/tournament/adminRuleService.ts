import { prisma } from '@/lib/db/prisma';
import { AdminAuditService } from '@/lib/audit/adminAudit';

export class AdminRuleService {
  /**
   * Adds a new dynamic rule to a match.
   */
  static async addRule(params: {
    matchId: string;
    ruleText: string;
    displayOrder?: number;
    adminUserId: string;
  }) {
    const { matchId, ruleText, displayOrder, adminUserId } = params;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new Error(`Match ${matchId} not found.`);
    }

    let order = displayOrder;
    if (order === undefined) {
      const highest = await prisma.matchRule.findFirst({
        where: { matchId },
        orderBy: { displayOrder: 'desc' },
      });
      order = (highest?.displayOrder || 0) + 1;
    }

    const rule = await prisma.matchRule.create({
      data: {
        matchId,
        ruleText: ruleText.trim(),
        displayOrder: order,
        isActive: true,
      },
    });

    await AdminAuditService.record({
      action: 'RULE_CREATED',
      actorId: adminUserId,
      entityType: 'MATCH_RULE',
      entityId: rule.id,
      details: { matchId, ruleText: rule.ruleText, displayOrder: rule.displayOrder },
    });

    return rule;
  }

  /**
   * Updates an existing match rule.
   */
  static async updateRule(params: {
    ruleId: string;
    ruleText?: string;
    displayOrder?: number;
    isActive?: boolean;
    adminUserId: string;
  }) {
    const { ruleId, ruleText, displayOrder, isActive, adminUserId } = params;

    const existing = await prisma.matchRule.findUnique({ where: { id: ruleId } });
    if (!existing) {
      throw new Error(`Match rule ${ruleId} not found.`);
    }

    const updated = await prisma.matchRule.update({
      where: { id: ruleId },
      data: {
        ruleText: ruleText !== undefined ? ruleText.trim() : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await AdminAuditService.record({
      action: 'RULE_UPDATED',
      actorId: adminUserId,
      entityType: 'MATCH_RULE',
      entityId: ruleId,
      details: { matchId: existing.matchId, changes: { ruleText, displayOrder, isActive } },
    });

    return updated;
  }

  /**
   * Deletes a match rule.
   */
  static async deleteRule(ruleId: string, adminUserId: string) {
    const existing = await prisma.matchRule.findUnique({ where: { id: ruleId } });
    if (!existing) {
      throw new Error(`Match rule ${ruleId} not found.`);
    }

    await prisma.matchRule.delete({ where: { id: ruleId } });

    await AdminAuditService.record({
      action: 'RULE_DELETED',
      actorId: adminUserId,
      entityType: 'MATCH_RULE',
      entityId: ruleId,
      details: { matchId: existing.matchId, ruleText: existing.ruleText },
    });

    return { success: true };
  }

  /**
   * Re-orders all rules for a match.
   */
  static async reorderRules(matchId: string, ruleIdsInOrder: string[], adminUserId: string) {
    await prisma.$transaction(
      ruleIdsInOrder.map((ruleId, index) =>
        prisma.matchRule.update({
          where: { id: ruleId },
          data: { displayOrder: index + 1 },
        })
      )
    );

    await AdminAuditService.record({
      action: 'RULE_UPDATED',
      actorId: adminUserId,
      entityType: 'MATCH',
      entityId: matchId,
      details: { newOrder: ruleIdsInOrder },
    });

    return { success: true };
  }
}
