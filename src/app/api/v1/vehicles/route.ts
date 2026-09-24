import { VehicleService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth, getOptionalAuth } from '@/lib/api/apiAuth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requirePermission } from '@/lib/auth/rbac';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';
import { UnauthorizedError } from '@/server/services/errors';

const vehicleService = new VehicleService();

const CREATE_RATE_LIMIT = 20;
const CREATE_RATE_WINDOW_MS = 60 * 1000;

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await getOptionalAuth();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as 'active' | 'sold' | 'reserved' | 'draft' | null;

  // Public / customers only ever see active inventory.
  if (status === 'active' || !auth || auth.role === 'customer') {
    const vehicles = await vehicleService.getActiveVehicles();
    return apiSuccess(vehicles);
  }

  // Staff/admin requesting non-active statuses requires vehicles.read.
  try {
    await requirePermission(auth, 'vehicles.read');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return apiError(error.message, error.code, 403);
    }
    throw error;
  }

  const vehicles = await vehicleService.getAllVehicles();
  return apiSuccess(vehicles);
});

export const POST = withAuth(async (req, auth) => {
  await enforceRateLimit('vehicles-create', getRateLimitIdentifierAuthenticated(auth.userId), CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_MS);
  const body = await req.json();
  const vehicle = await vehicleService.createVehicle(body);
  return apiSuccess(vehicle, undefined, 'Vehicle created successfully', 201);
}, { permission: 'vehicles.create' });
