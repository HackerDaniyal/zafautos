import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let dbCallCount = 0;
let dbReturnValues: any[] = [];

const mockNotificationCreate = vi.fn();
const mockNotificationFindByEventKey = vi.fn();
const mockNotificationGetPreference = vi.fn();

vi.mock('@/server/repositories/notificationRepository', () => ({
  NotificationRepository: vi.fn().mockImplementation(function () {
    return {
      create: mockNotificationCreate,
      findByEventKey: mockNotificationFindByEventKey,
      getPreference: mockNotificationGetPreference,
      findByUser: vi.fn().mockResolvedValue({ notifications: [], total: 0 }),
      getUnreadCount: vi.fn().mockResolvedValue(0),
      markRead: vi.fn().mockResolvedValue(undefined),
      markAllRead: vi.fn().mockResolvedValue(0),
    };
  }),
}));

const mockEmailServiceSend = vi.fn().mockResolvedValue({ success: true });

vi.mock('@/server/services/emailService', () => ({
  EmailService: vi.fn().mockImplementation(function () {
    return { send: mockEmailServiceSend };
  }),
}));

const mockDbLimit = vi.fn();

vi.mock('@/server/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockDbLimit,
        }),
      }),
    }),
  },
}));

vi.mock('@/server/db/schema/settings', () => ({
  notificationRules: { eventType: 'eventType', isEnabled: 'isEnabled', sendInApp: 'sendInApp', sendEmail: 'sendEmail' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  isNull: vi.fn(),
}));

beforeEach(() => {
  dbCallCount = 0;
  dbReturnValues = [];
  vi.clearAllMocks();
});

describe('Notification - Rule Evaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates in-app notification when rule is enabled and sendInApp is true', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({
      id: 'notif-001',
      userId: 'user-001',
      type: 'rule_eval_enabled',
      title: 'Order Confirmed',
    });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'rule_eval_enabled',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Your order has been confirmed.',
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
  });

  it('skips notification when rule is disabled', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: false,
      sendInApp: true,
      sendEmail: false,
    }]);

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'rule_disabled_skip',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Your order has been confirmed.',
    });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('defaults to enabled when no rule exists', async () => {
    mockDbLimit.mockResolvedValue([]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({ id: 'notif-002' });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'default_enabled_test',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
  });
});

describe('Notification - User Preference Checking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('respects inAppEnabled preference set to false', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue({
      inAppEnabled: false,
      emailEnabled: true,
    });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'pref_inapp_disabled',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
    });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('sends in-app notification when preference is enabled', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue({
      inAppEnabled: true,
      emailEnabled: true,
    });
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({ id: 'notif-003' });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'pref_inapp_enabled',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
  });

  it('defaults to enabled when no preference exists', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({ id: 'notif-004' });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'pref_default_enabled',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
  });
});

describe('Notification - eventKey Deduplication', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips notification when eventKey already exists', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue({
      id: 'existing-notif',
      eventKey: 'order:001:status:confirmed',
    });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'dedup_existing_key',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
      eventKey: 'order:001:status:confirmed',
    });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('creates notification when eventKey is new', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({ id: 'notif-005' });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'dedup_new_key',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
      eventKey: 'order:001:status:confirmed:unique',
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
  });

  it('creates notification when no eventKey is provided', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({ id: 'notif-006' });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'dedup_no_key',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
  });
});

describe('Notification - Email Dispatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends email when rule.sendEmail is true and emailEnabled', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: false,
      sendEmail: true,
    }]);
    mockNotificationGetPreference.mockResolvedValue({
      inAppEnabled: false,
      emailEnabled: true,
    });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'email_send_test',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Your order is confirmed.',
      emailTo: 'user@test.com',
      emailSubject: 'Order Confirmed',
      emailHtml: '<p>Your order is confirmed.</p>',
    });

    expect(mockEmailServiceSend).toHaveBeenCalledWith({
      to: 'user@test.com',
      subject: 'Order Confirmed',
      html: '<p>Your order is confirmed.</p>',
      text: 'Order Confirmed\n\nYour order is confirmed.',
    });
  });

  it('does not send email when emailEnabled is false', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: false,
      sendEmail: true,
    }]);
    mockNotificationGetPreference.mockResolvedValue({
      inAppEnabled: false,
      emailEnabled: false,
    });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'email_disabled_test',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
      emailTo: 'user@test.com',
      emailSubject: 'Order Confirmed',
      emailHtml: '<p>Test</p>',
    });

    expect(mockEmailServiceSend).not.toHaveBeenCalled();
  });

  it('does not send email when emailTo is missing', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: false,
      sendEmail: true,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatch({
      userId: 'user-001',
      type: 'email_no_to_test',
      category: 'order',
      title: 'Order Confirmed',
      body: 'Test body',
    });

    expect(mockEmailServiceSend).not.toHaveBeenCalled();
  });
});

describe('Notification - Failure Isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not throw when notification creation fails', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockRejectedValue(new Error('DB connection failed'));

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();

    await expect(
      service.dispatch({
        userId: 'user-001',
        type: 'fail_create_test',
        category: 'order',
        title: 'Order Confirmed',
        body: 'Test body',
      })
    ).resolves.toBeUndefined();
  });

  it('does not throw when email service fails', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: false,
      sendEmail: true,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockEmailServiceSend.mockRejectedValue(new Error('SMTP error'));

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();

    await expect(
      service.dispatch({
        userId: 'user-001',
        type: 'fail_email_test',
        category: 'order',
        title: 'Order Confirmed',
        body: 'Test body',
        emailTo: 'user@test.com',
        emailSubject: 'Order Confirmed',
        emailHtml: '<p>Test</p>',
      })
    ).resolves.toBeUndefined();
  });

  it('does not throw when preference lookup fails', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockRejectedValue(new Error('DB error'));

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();

    await expect(
      service.dispatch({
        userId: 'user-001',
        type: 'fail_pref_test',
        category: 'order',
        title: 'Order Confirmed',
        body: 'Test body',
      })
    ).resolves.toBeUndefined();
  });
});

describe('Notification - Batch Dispatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches multiple notifications', async () => {
    mockDbLimit.mockResolvedValue([{
      isEnabled: true,
      sendInApp: true,
      sendEmail: false,
    }]);
    mockNotificationGetPreference.mockResolvedValue(null);
    mockNotificationFindByEventKey.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({ id: 'notif-batch' });

    const { NotificationService } = await import('@/server/services/notificationService');
    const service = new NotificationService();
    await service.dispatchBatch([
      {
        userId: 'user-001',
        type: 'batch_test_1',
        category: 'order',
        title: 'Order Confirmed',
        body: 'Body 1',
      },
      {
        userId: 'user-002',
        type: 'batch_test_2',
        category: 'shipping',
        title: 'Order Shipped',
        body: 'Body 2',
      },
    ]);

    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
  });
});
