import { VehicleService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const vehicleService = new VehicleService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const vehicle = await vehicleService.getVehicleById(id);
  return apiSuccess(vehicle);
});

export const PATCH = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await req.json();
  const vehicle = await vehicleService.updateVehicle(id, body);
  return apiSuccess(vehicle, undefined, 'Vehicle updated successfully');
});

export const DELETE = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  await vehicleService.deleteVehicle(id);
  return apiSuccess(null, undefined, 'Vehicle deleted successfully', 200);
});
