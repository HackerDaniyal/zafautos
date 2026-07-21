# Server Actions Map

All server actions are in `src/server/actions/` with `"use server"` directive.

## Vehicle Actions (`vehicleActions.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `createVehicle(data)` | Admin | Create new vehicle listing |
| `updateVehicle(id, data)` | Admin | Update vehicle details |
| `deleteVehicle(id)` | Admin | Soft delete vehicle |
| `publishVehicle(id)` | Admin | Set status → active |
| `archiveVehicle(id)` | Admin | Set status → archived |
| `featureVehicle(id, featured)` | Admin | Toggle featured flag |
| `uploadVehicleImages(vehicleId, formData)` | Admin | Upload images to storage |

## Order Actions (`orderActions.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `createOrder(data)` | Auth | Create new order |
| `updateOrderStatus(orderId, status)` | Admin | Update order status |
| `cancelOrder(orderId)` | Admin | Cancel order |
| `assignDealerToOrder(orderId, dealerId)` | Admin | Assign dealer |

## Payment Actions (`paymentActions.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `createPayment(data)` | Auth | Create payment record |
| `updatePaymentStatus(paymentId, status)` | Admin | Update payment status |
| `createInvoice(data)` | Admin | Generate invoice |

## Shipping Actions (`shippingActions.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `createShipment(data)` | Admin | Create shipment |
| `addTrackingEvent(data)` | Admin | Add tracking update |
| `addContainer(data)` | Admin | Assign container |

## Customer Actions (`customerActions.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `updateCustomerProfile(customerId, data)` | Owner | Update profile |
| `addAddress(data)` | Owner | Add address |
| `removeAddress(addressId)` | Owner | Remove address |
| `addToWishlist(customerId, vehicleId)` | Owner | Add to wishlist |
| `removeFromWishlist(customerId, vehicleId)` | Owner | Remove from wishlist |

## Response Format

All actions return `ActionResult<T>`:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };
```
