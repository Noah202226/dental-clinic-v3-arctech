"use client";

import {
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiPieChart,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Dummy data for sales trend
const salesData = [
  { day: "Mon", revenue: 1200 },
  { day: "Tue", revenue: 900 },
  { day: "Wed", revenue: 1500 },
  { day: "Thu", revenue: 1100 },
  { day: "Fri", revenue: 2000 },
  { day: "Sat", revenue: 1800 },
  { day: "Sun", revenue: 2200 },
];

export default function SalesSection() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">💰 Sales Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today’s Revenue</p>
              <h2 className="text-2xl font-bold">$2,150</h2>
            </div>
            <FiDollarSign className="text-primary text-3xl" />
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <h2 className="text-2xl font-bold">$4,780</h2>
            </div>
            <FiPieChart className="text-secondary text-3xl" />
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Growth</p>
              <h2 className="text-2xl font-bold">+12%</h2>
            </div>
            <FiTrendingUp className="text-accent text-3xl" />
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="card bg-base-100 shadow-lg p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <FiCalendar /> Weekly Revenue Trend
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
