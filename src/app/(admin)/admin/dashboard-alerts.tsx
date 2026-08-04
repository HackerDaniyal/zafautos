'use client';

import { AlertTriangle, Clock, XCircle, FileWarning } from 'lucide-react';

interface Alerts {
  draftVehicles: number;
  delayedShipments: number;
  pendingPayments: number;
  failedPayments: number;
}

function DashboardAlerts({ alerts }: { alerts: Alerts | null }) {
  if (!alerts) return null;

  const items = [
    { label: 'Pending Payments', count: alerts.pendingPayments, icon: Clock, color: 'text-auction-amber' },
    { label: 'Delayed Shipments', count: alerts.delayedShipments, icon: AlertTriangle, color: 'text-signal-red' },
    { label: 'Draft Vehicles', count: alerts.draftVehicles, icon: FileWarning, color: 'text-steel' },
    { label: 'Failed Payments', count: alerts.failedPayments, icon: XCircle, color: 'text-signal-red' },
  ].filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 rounded-[10px] border border-iron/30 bg-carbon p-4">
          <item.icon className={`size-5 ${item.color}`} />
          <div>
            <p className="text-2xl font-bold text-pure-white">{item.count}</p>
            <p className="text-xs text-steel">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { DashboardAlerts };
