# Repository Architecture

## Pattern

Each domain area has a Repository class extending `BaseRepository<T>`.

```
BaseRepository<Table>
├── findAll()
├── findById(id)
├── create(data)
├── update(id, data)
├── delete(id)
├── softDelete(id, deletedBy?)
├── findMany({ filters, pagination, sort })
├── count(filters?)
└── exists(id)
```

## Repositories

| Repository | File | Tables |
|-----------|------|--------|
| `AuthRepository` | `authRepository.ts` | users, roles, permissions, sessions, profiles, role_permissions |
| `VehicleRepository` | `vehicleRepository.ts` | vehicles, vehicle_images + advanced filtering/pagination |
| `CustomerRepository` | `customerRepository.ts` | customers, profiles, addresses, wishlist, alerts, settings |
| `DealerRepository` | `dealerRepository.ts` | dealers, profiles, assignments, activity |
| `OrderRepository` | `orderRepository.ts` | orders, order_items |
| `PaymentsRepository` | `paymentsRepository.ts` | payments, history, methods, currencies, exchange_rates, invoices |
| `ShippingRepository` | `shippingRepository.ts` | shipments, tracking, containers, ports, documents |
| `MessagesRepository` | `messagesRepository.ts` | messages, threads, notifications, email_logs |
| `MarketplaceRepository` | `marketplaceRepository.ts` | featured_vehicles, views, compare, wishlist, enquiries |
| `DocumentsRepository` | `documentsRepository.ts` | documents, categories, versions |

## Advanced VehicleRepository

```typescript
// Filtering
const result = await vehicleRepo.listVehicles({
  filters: {
    manufacturerId: '...',
    status: 'active',
    yearMin: 2020,
    priceMax: 30000,
    mileageMax: 50000,
    search: 'corolla',
  },
  pagination: { page: 1, limit: 20 },
  sort: { column: 'price', direction: 'asc' },
});

// Returns: { data: Vehicle[], meta: { total, page, limit, totalPages } }
```

## Service Layer

Services wrap repositories with:
- Zod validation schemas
- Business logic
- Domain error throwing

```
VehicleService → VehicleRepository → BaseRepository → db
OrderService → OrderRepository → BaseRepository → db
...
```
