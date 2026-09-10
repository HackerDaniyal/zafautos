import { NotificationRepository } from '@/server/repositories/notificationRepository';
import { EmailService } from '@/server/services/emailService';
import { db } from '@/server/db/client';
import { notificationRules } from '@/server/db/schema/settings';
import { eq, isNull } from 'drizzle-orm';
import type { notificationCategoryEnum } from '@/server/db/schema/common';

type NotificationCategory = typeof notificationCategoryEnum.enumValues[number];

export interface DispatchNotificationParams {
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  eventKey?: string;
  emailTo?: string;
  emailSubject?: string;
  emailHtml?: string;
}

const NOTIFICATION_RULE_CACHE = new Map<string, { isEnabled: boolean; sendInApp: boolean; sendEmail: boolean }>();
let rulesCacheExpiry = 0;

export class NotificationService {
  private repo = new NotificationRepository();
  private emailService = new EmailService();

  private async getRule(eventType: string) {
    const now = Date.now();
    if (now > rulesCacheExpiry) {
      NOTIFICATION_RULE_CACHE.clear();
      rulesCacheExpiry = now + 60_000;
    }

    if (NOTIFICATION_RULE_CACHE.has(eventType)) {
      return NOTIFICATION_RULE_CACHE.get(eventType)!;
    }

    const [rule] = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.eventType, eventType))
      .limit(1);

    const result = rule
      ? { isEnabled: rule.isEnabled, sendInApp: rule.sendInApp, sendEmail: rule.sendEmail }
      : { isEnabled: true, sendInApp: true, sendEmail: false };

    NOTIFICATION_RULE_CACHE.set(eventType, result);
    return result;
  }

  async dispatch(params: DispatchNotificationParams): Promise<void> {
    try {
      const rule = await this.getRule(params.type);
      if (!rule.isEnabled) return;

      const preference = await this.repo.getPreference(params.userId, params.category);
      const inAppEnabled = preference?.inAppEnabled ?? true;
      const emailEnabled = preference?.emailEnabled ?? true;

      if (rule.sendInApp && inAppEnabled) {
        if (params.eventKey) {
          const existing = await this.repo.findByEventKey(params.eventKey);
          if (existing) return;
        }

        await this.repo.create({
          userId: params.userId,
          type: params.type,
          category: params.category,
          title: params.title,
          body: params.body,
          link: params.link,
          metadata: params.metadata,
          eventKey: params.eventKey,
        });
      }

      if (rule.sendEmail && emailEnabled && params.emailTo) {
        await this.sendEmail(params);
      }
    } catch (error) {
      console.error('Notification dispatch failed:', error);
    }
  }

  private async sendEmail(params: DispatchNotificationParams) {
    if (!params.emailTo || !params.emailSubject || !params.emailHtml) return;

    try {
      await this.emailService.send({
        to: params.emailTo,
        subject: params.emailSubject,
        html: params.emailHtml,
        text: params.title + '\n\n' + params.body,
      });
    } catch (error) {
      console.error('Email delivery failed (non-blocking):', error);
    }
  }

  async dispatchBatch(paramsArray: DispatchNotificationParams[]): Promise<void> {
    for (const params of paramsArray) {
      await this.dispatch(params);
    }
  }

  get repoInstance() {
    return this.repo;
  }
}

export const notificationService = new NotificationService();
