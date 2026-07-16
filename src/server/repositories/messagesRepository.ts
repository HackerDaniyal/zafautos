import { emailLogs, messages, messageThreads, notifications } from '@/server/db/schema';
import type { InferModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class MessagesRepository {
  public readonly messages = new BaseRepository(messages);
  public readonly threads = new BaseRepository(messageThreads);
  public readonly notifications = new BaseRepository(notifications);
  public readonly emailLogs = new BaseRepository(emailLogs);

  async findMessagesByThread(threadId: string) {
    return this.messages.getClient()
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId));
  }

  async createThread(data: InferModel<typeof messageThreads, 'insert'>) {
    return this.threads.create(data);
  }

  async createMessage(data: InferModel<typeof messages, 'insert'>) {
    return this.messages.create(data);
  }

  async sendNotification(data: InferModel<typeof notifications, 'insert'>) {
    return this.notifications.create(data);
  }

  async logEmail(data: InferModel<typeof emailLogs, 'insert'>) {
    return this.emailLogs.create(data);
  }
}
