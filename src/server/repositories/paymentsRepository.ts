import {
    currencies,
    exchangeRates,
    invoices,
    paymentHistory,
    paymentMethods,
    payments,
} from '@/server/db/schema';
import type { InferModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class PaymentsRepository {
  public readonly payments = new BaseRepository(payments);
  public readonly history = new BaseRepository(paymentHistory);
  public readonly methods = new BaseRepository(paymentMethods);
  public readonly currencies = new BaseRepository(currencies);
  public readonly exchangeRates = new BaseRepository(exchangeRates);
  public readonly invoices = new BaseRepository(invoices);

  async findByOrderId(orderId: string) {
    return this.payments.getClient()
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
  }

  async findByUserId(userId: string) {
    return this.payments.getClient()
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));
  }

  async createPayment(data: InferModel<typeof payments, 'insert'>) {
    return this.payments.create(data);
  }

  async recordHistory(data: InferModel<typeof paymentHistory, 'insert'>) {
    return this.history.create(data);
  }

  async createInvoice(data: InferModel<typeof invoices, 'insert'>) {
    return this.invoices.create(data);
  }

  async updatePaymentStatus(paymentId: string, status: InferModel<typeof payments, 'insert'>['status']) {
    const [payment] = await this.payments.getClient()
      .update(payments)
      .set({ status })
      .where(eq(payments.id, paymentId))
      .returning();

    return payment ?? null;
  }
}
