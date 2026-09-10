import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockDbSelect = vi.fn();

vi.mock('@/server/db/client', () => ({
  db: {
    select: mockDbSelect,
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

vi.mock('@/server/db/schema', () => ({
  customers: { id: 'id', userId: 'userId' },
  users: { id: 'id', email: 'email', role: 'role' },
  orders: { id: 'id', customerId: 'customerId' },
  vehicles: { id: 'id', year: 'year', stockNumber: 'stockNumber', manufacturerId: 'manufacturerId', modelId: 'modelId' },
  manufacturers: { id: 'id', name: 'name' },
  models: { id: 'id', name: 'name' },
}));

const mockSupportRepo = {
  createTicket: vi.fn(),
  addMessage: vi.fn(),
  findById: vi.fn(),
  findTicketWithRelations: vi.fn(),
  getTicketMessages: vi.fn(),
  listTickets: vi.fn(),
  updateTicket: vi.fn(),
  countByStatus: vi.fn(),
};

vi.mock('@/server/repositories/supportRepository', () => ({
  SupportRepository: vi.fn().mockImplementation(function () {
    return mockSupportRepo;
  }),
}));

vi.mock('@/server/services/auditService', () => ({
  auditService: { logAction: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/server/services/notificationService', () => ({
  notificationService: { dispatch: vi.fn().mockResolvedValue(undefined) },
}));

function makeTicket(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440040',
    customerId: 'cust-001',
    orderId: null,
    subject: 'Cannot access my order',
    description: 'I am unable to view my order details.',
    category: 'order',
    priority: 'medium',
    status: 'open',
    assignedTo: null,
    resolvedAt: null,
    closedAt: null,
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDbChainMock(returnValues: any[]) {
  let callIndex = 0;
  const chainFn = vi.fn().mockImplementation(() => {
    const idx = callIndex++;
    const value = idx < returnValues.length ? returnValues[idx] : [];
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(Array.isArray(value) ? value : [value]),
          then: (resolve: any) => Promise.resolve(Array.isArray(value) ? value : [value]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve(Array.isArray(value) ? value : [value]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve(Array.isArray(value) ? value : [value]).then(resolve),
    };
  });
  return chainFn;
}

describe('Support - Ticket Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a ticket when customer profile exists', async () => {
    mockDbSelect.mockImplementation(() => {
      const chain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: 'cust-001' }]),
            then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
          }),
          then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
      };
      return chain;
    });

    mockSupportRepo.createTicket.mockResolvedValue(makeTicket());
    mockSupportRepo.addMessage.mockResolvedValue({ id: 'msg-001' });

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.createTicket('user-001', {
      subject: 'Cannot access my order',
      description: 'I am unable to view my order details.',
      category: 'order',
      priority: 'medium',
    });

    expect(result).toBeDefined();
    expect(result.subject).toBe('Cannot access my order');
    expect(mockSupportRepo.createTicket).toHaveBeenCalled();
    expect(mockSupportRepo.addMessage).toHaveBeenCalled();
  });

  it('throws when customer profile not found', async () => {
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();

    await expect(
      service.createTicket('nonexistent-user', {
        subject: 'Test',
        description: 'Test description',
        category: 'general',
        priority: 'low',
      })
    ).rejects.toThrow('Customer profile not found');
  });

  it('validates order belongs to customer when orderId is provided', async () => {
    let callCount = 0;
    mockDbSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'cust-001' }]),
              then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
            }),
            then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
          }),
          then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
        };
      }
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
            then: (resolve: any) => Promise.resolve([]).then(resolve),
          }),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      };
    });

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();

    await expect(
      service.createTicket('user-001', {
        subject: 'Order issue',
        description: 'Problem with order',
        category: 'order',
        priority: 'medium',
        orderId: 'order-not-yours',
      })
    ).rejects.toThrow('Order not found');
  });
});

describe('Support - Message Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a message to a ticket', async () => {
    const ticket = makeTicket({ status: 'open' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.addMessage.mockResolvedValue({ id: 'msg-002', message: 'Hello' });

    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 'cust-001' }]),
          then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.addMessage(ticket.id, 'staff-001', true, {
      message: 'Hello',
    });

    expect(result).toBeDefined();
    expect(mockSupportRepo.addMessage).toHaveBeenCalled();
  });

  it('throws when ticket not found', async () => {
    mockSupportRepo.findById.mockResolvedValue(null);

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();

    await expect(
      service.addMessage('nonexistent', 'user-001', false, { message: 'Hi' })
    ).rejects.toThrow('Support ticket not found');
  });

  it('customers cannot reply to closed tickets', async () => {
    const ticket = makeTicket({ status: 'closed' });
    mockSupportRepo.findById.mockResolvedValue(ticket);

    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'cust-001' }]),
          then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();

    await expect(
      service.addMessage(ticket.id, 'user-001', false, { message: 'Reply' })
    ).rejects.toThrow('closed or resolved');
  });
});

describe('Support - Status Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('transitions from open to in_progress', async () => {
    const ticket = makeTicket({ status: 'open' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, status: 'in_progress' });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'staff-001', true, {
      status: 'in_progress',
    });

    expect(result).toBeDefined();
    expect(mockSupportRepo.updateTicket).toHaveBeenCalled();
  });

  it('transitions from in_progress to resolved', async () => {
    const ticket = makeTicket({ status: 'in_progress' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, status: 'resolved', resolvedAt: new Date() });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'staff-001', true, {
      status: 'resolved',
    });

    expect(result).toBeDefined();
  });

  it('transitions from resolved to closed', async () => {
    const ticket = makeTicket({ status: 'resolved' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, status: 'closed', closedAt: new Date() });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'staff-001', true, {
      status: 'closed',
    });

    expect(result).toBeDefined();
  });

  it('transitions directly from open to resolved', async () => {
    const ticket = makeTicket({ status: 'open' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, status: 'resolved', resolvedAt: new Date() });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'staff-001', true, {
      status: 'resolved',
    });

    expect(result).toBeDefined();
  });
});

describe('Support - Priority and Category', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates priority', async () => {
    const ticket = makeTicket({ priority: 'low' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, priority: 'urgent' });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'staff-001', true, {
      priority: 'urgent',
    });

    expect(result).toBeDefined();
  });

  it('updates category', async () => {
    const ticket = makeTicket({ category: 'general' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, category: 'payment' });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'staff-001', true, {
      category: 'payment',
    });

    expect(result).toBeDefined();
  });
});

describe('Support - Ticket Assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns a staff member to a ticket', async () => {
    const ticket = makeTicket({ assignedTo: null });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, assignedTo: 'staff-001' });
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'admin-001', true, {
      assignedTo: 'staff-001',
    });

    expect(result).toBeDefined();
    expect(mockSupportRepo.updateTicket).toHaveBeenCalled();
  });

  it('customers cannot assign tickets', async () => {
    const ticket = makeTicket({ assignedTo: null, customerId: 'cust-001' });
    mockSupportRepo.findById.mockResolvedValue(ticket);

    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'cust-001' }]),
          then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();

    await expect(
      service.updateTicket(ticket.id, 'cust-user-001', false, { assignedTo: 'staff-001' })
    ).rejects.toThrow('Not authorized');
  });

  it('customers can only close their own tickets', async () => {
    const ticket = makeTicket({ status: 'open', customerId: 'cust-001' });
    mockSupportRepo.findById.mockResolvedValue(ticket);
    mockSupportRepo.updateTicket.mockResolvedValue({ ...ticket, status: 'closed', closedAt: new Date() });

    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'cust-001' }]),
          then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
        }),
        then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
      }),
      then: (resolve: any) => Promise.resolve([{ id: 'cust-001' }]).then(resolve),
    }));

    const { SupportService } = await import('@/server/services/supportService');
    const service = new SupportService();
    const result = await service.updateTicket(ticket.id, 'cust-user-001', false, {
      status: 'closed',
    });

    expect(result).toBeDefined();
  });
});
