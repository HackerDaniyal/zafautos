'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = {
  signalRed: '#E5231B',
  deepRed: '#9E1913',
  availableGreen: '#3BA55D',
  auctionAmber: '#D89A2E',
  steel: '#6E6E6E',
  iron: '#2A2A2A',
};

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="month"
          stroke="#6E6E6E"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#6E6E6E"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '6px',
            color: '#FFFFFF',
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.signalRed}
          fill={CHART_COLORS.signalRed}
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface OrdersChartProps {
  data: { month: string; orders: number }[];
}

function OrdersChart({ data }: OrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="month"
          stroke="#6E6E6E"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#6E6E6E"
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '6px',
            color: '#FFFFFF',
          }}
        />
        <Bar dataKey="orders" fill={CHART_COLORS.signalRed} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface VehicleStatusChartProps {
  data: { name: string; value: number }[];
}

const PIE_COLORS = [
  CHART_COLORS.availableGreen,
  CHART_COLORS.signalRed,
  CHART_COLORS.steel,
  CHART_COLORS.auctionAmber,
];

function VehicleStatusChart({ data }: VehicleStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '6px',
            color: '#FFFFFF',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { RevenueChart, OrdersChart, VehicleStatusChart };
