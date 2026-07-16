import { BaseRepository } from '@/server/repositories';
import { analyticsEvents, pageViews, searchHistory } from '@/server/db/schema';
import { z } from 'zod';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const CreateAnalyticsEventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
});
export type CreateAnalyticsEventDTO = z.infer<typeof CreateAnalyticsEventSchema>;

export const CreatePageViewSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
});
export type CreatePageViewDTO = z.infer<typeof CreatePageViewSchema>;

export const CreateSearchHistorySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
});
export type CreateSearchHistoryDTO = z.infer<typeof CreateSearchHistorySchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

export class AnalyticsService {
  private eventsRepo = new BaseRepository(analyticsEvents);
  private viewsRepo = new BaseRepository(pageViews);
  private searchRepo = new BaseRepository(searchHistory);

  /**
   * Tracks a custom analytics event.
   */
  async trackEvent(data: CreateAnalyticsEventDTO) {
    const validatedData = CreateAnalyticsEventSchema.parse(data);
    return this.eventsRepo.create(validatedData as unknown as Parameters<typeof this.eventsRepo.create>[0]);
  }

  /**
   * Tracks a page view.
   */
  async trackPageView(data: CreatePageViewDTO) {
    const validatedData = CreatePageViewSchema.parse(data);
    return this.viewsRepo.create(validatedData as unknown as Parameters<typeof this.viewsRepo.create>[0]);
  }

  /**
   * Records a user's search query.
   */
  async recordSearch(data: CreateSearchHistoryDTO) {
    const validatedData = CreateSearchHistorySchema.parse(data);
    return this.searchRepo.create(validatedData as unknown as Parameters<typeof this.searchRepo.create>[0]);
  }
}
