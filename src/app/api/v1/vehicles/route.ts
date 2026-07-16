import { VehicleService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const vehicleService = new VehicleService();

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as 'active' | 'sold' | 'reserved' | 'draft' | null;
  
  const vehicles = status === 'active'
    ? await vehicleService.getActiveVehicles() 
    : await vehicleService.getAllVehicles();
    
  return apiSuccess(vehicles);
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const vehicle = await vehicleService.createVehicle(body);
  return apiSuccess(vehicle, undefined, 'Vehicle created successfully', 201);
});
