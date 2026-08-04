import { DashboardRepository } from '@/server/repositories/dashboardRepository';

const dashboardRepo = new DashboardRepository();

export class DashboardService {
  async getDashboardStats(dateFrom?: Date, dateTo?: Date) {
    const [vehicleStats, orderStats, paymentStats, shipmentStats, recentOrders, revenueByMonth, ordersByMonth, recentActivity, alerts] = await Promise.all([
      dashboardRepo.getVehicleStats(),
      dashboardRepo.getOrderStats(dateFrom, dateTo),
      dashboardRepo.getPaymentStats(),
      dashboardRepo.getShipmentStats(),
      dashboardRepo.getRecentOrders(5),
      dashboardRepo.getRevenueByMonth(6),
      dashboardRepo.getOrdersByMonth(6),
      dashboardRepo.getRecentActivity(10),
      dashboardRepo.getAlerts(),
    ]);

    return {
      vehicleStats,
      orderStats,
      paymentStats,
      shipmentStats,
      recentOrders,
      revenueByMonth,
      ordersByMonth,
      recentActivity,
      alerts,
    };
  }
}
