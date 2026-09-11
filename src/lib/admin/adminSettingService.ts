import { prisma } from '@/lib/db/prisma';
import { AdminAuditService } from '@/lib/audit/adminAudit';

export class AdminSettingService {
  /**
   * Retrieves all app settings.
   */
  static async getSettings() {
    const settings = await prisma.appSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  }

  /**
   * Updates an app setting with audit log.
   */
  static async updateSetting(key: string, value: any, adminUserId: string) {
    const updated = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await AdminAuditService.record({
      action: 'SETTINGS_UPDATED',
      actorId: adminUserId,
      entityType: 'APP_SETTING',
      entityId: key,
      details: { key, value },
    });

    return updated;
  }

  /**
   * Lists banners.
   */
  static async listBanners() {
    return await prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Creates a banner.
   */
  static async createBanner(data: {
    title: string;
    subtitle?: string;
    badge?: string;
    ctaText?: string;
    imageUrl: string;
    linkUrl?: string;
    displayOrder?: number;
    isActive?: boolean;
    adminUserId: string;
  }) {
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        badge: data.badge || null,
        ctaText: data.ctaText || null,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    await AdminAuditService.record({
      action: 'BANNER_CREATED',
      actorId: data.adminUserId,
      entityType: 'BANNER',
      entityId: banner.id,
      details: { title: banner.title },
    });

    return banner;
  }

  /**
   * Updates a banner.
   */
  static async updateBanner(id: string, data: any, adminUserId: string) {
    const banner = await prisma.banner.update({
      where: { id },
      data,
    });

    await AdminAuditService.record({
      action: 'BANNER_UPDATED',
      actorId: adminUserId,
      entityType: 'BANNER',
      entityId: id,
      details: data,
    });

    return banner;
  }

  /**
   * Deletes a banner.
   */
  static async deleteBanner(id: string, adminUserId: string) {
    const banner = await prisma.banner.delete({ where: { id } });

    await AdminAuditService.record({
      action: 'BANNER_DELETED',
      actorId: adminUserId,
      entityType: 'BANNER',
      entityId: id,
      details: { title: banner.title },
    });

    return banner;
  }
}
