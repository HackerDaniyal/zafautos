import { BaseRepository } from './baseRepository';
import { analyticsEvents, pageViews, searchHistory } from '@/server/db/schema';

export class AnalyticsEventsRepository extends BaseRepository<typeof analyticsEvents> {
  constructor() {
    super(analyticsEvents);
  }
}

export class PageViewsRepository extends BaseRepository<typeof pageViews> {
  constructor() {
    super(pageViews);
  }
}

export class SearchHistoryRepository extends BaseRepository<typeof searchHistory> {
  constructor() {
    super(searchHistory);
  }
}
