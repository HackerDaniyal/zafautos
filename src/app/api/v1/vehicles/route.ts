import { VehicleService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth, getOptionalAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';

const vehicleService = new VehicleService();

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await getOptionalAuth();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as 'active' | 'sold' | 'reserved' | 'draft' | null;

  if (status === 'active' || !auth || auth.role === 'customer') {
    const vehicles = await vehicleService.getActiveVehicles();
    return apiSuccess(vehicles);
  }

  const vehicles = await vehicleService.getAllVehicles();
  return apiSuccess(vehicles);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const vehicle = await vehicleService.createVehicle(body);
  return apiSuccess(vehicle, undefined, 'Vehicle created successfully', 201);
}, { permission: 'vehicles.create' });
