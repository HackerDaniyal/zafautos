import { DashboardRepository } from '@/server/repositories/dashboardRepository';

const dashboardRepo = new DashboardRepository();

export class DashboardService {
  async getDashboardStats(dateFrom?: Date, dateTo?: Date) {
    const [
      vehicleStats, orderStats, shipmentStats, recentOrders,
      revenueByMonth, ordersByMonth, recentActivity, alerts,
    ] = await Promise.all([
      dashboardRepo.getVehicleStats(),
      dashboardRepo.getOrderStats(dateFrom, dateTo),
      dashboardRepo.getShipmentStats(),
      dashboardRepo.getRecentOrders(5),
      dashboardRepo.getRevenueByMonth(dateFrom, dateTo),
      dashboardRepo.getOrdersByMonth(dateFrom, dateTo),
      dashboardRepo.getRecentActivity(10),
      dashboardRepo.getAlerts(),
    ]);

    return {
      vehicleStats,
      orderStats,
      shipmentStats,
      recentOrders,
      revenueByMonth,
      ordersByMonth,
      recentActivity,
      alerts,
    };
  }

  async getAnalyticsDashboard(dateFrom?: Date, dateTo?: Date) {
    const [
      vehicleStats,
      userStats,
      pendingRevenue,
      revenue,
      revenueByMonth,
      ordersByMonth,
      orderStatusBreakdown,
      shipmentStatusBreakdown,
      paymentStatusBreakdown,
      paymentMethodBreakdown,
      invoiceStats,
      pageViewStats,
      vehicleViewStats,
      searchStats,
    ] = await Promise.all([
      // Snapshot metrics (NOT date-filtered)
      dashboardRepo.getVehicleStats(),
      dashboardRepo.getUserStats(),
      dashboardRepo.getPendingRevenue(),
      // Period metrics (date-filtered)
      dashboardRepo.getRevenue(dateFrom, dateTo),
      dashboardRepo.getRevenueByMonth(dateFrom, dateTo),
      dashboardRepo.getOrdersByMonth(dateFrom, dateTo),
      dashboardRepo.getOrderStatusBreakdown(dateFrom, dateTo),
      dashboardRepo.getShipmentStatusBreakdown(),
      dashboardRepo.getPaymentStatusBreakdown(dateFrom, dateTo),
      dashboardRepo.getPaymentMethodBreakdown(dateFrom, dateTo),
      dashboardRepo.getInvoiceStats(),
      dashboardRepo.getPageViewStats(dateFrom, dateTo),
      dashboardRepo.getVehicleViewStats(dateFrom, dateTo),
      dashboardRepo.getSearchStats(dateFrom, dateTo),
    ]);

    return {
      // Snapshot (current state)
      vehicleStats,
      userStats,
      pendingRevenue,
      // Period (date-filtered)
      revenue,
      revenueByMonth,
      ordersByMonth,
      orderStatusBreakdown,
      shipmentStatusBreakdown,
      paymentStatusBreakdown,
      paymentMethodBreakdown,
      invoiceStats,
      // Engagement (date-filtered)
      pageViewStats,
      vehicleViewStats,
      searchStats,
    };
  }
}
