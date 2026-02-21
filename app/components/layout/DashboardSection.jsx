"use client";

import {
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiTrendingUp,
} from "react-icons/fi";

export default function DashboardSection({
  stats = {
    totalPatients: 0,
    newPatients: 0,
    activeTreatments: 0,
    revenueMonth: 0,
    revenueGrowth: 0,
    outstandingBalance: 0,
  },
  topServices = [],
}) {
  return (
    <div className="p-6 space-y-4 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--theme-color)] flex items-center gap-2">
          🦷 Clinic Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Key insights about patients, revenue, and treatments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients */}
        <div className="bg-white border border-green-100 rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Total Patients</p>
              <p className="text-3xl font-bold text-green-700">
                {stats.totalPatients.toLocaleString()}
              </p>
            </div>
            <FiUsers className="text-green-600 text-3xl" />
          </div>
          <p className="text-sm text-green-600 mt-1">
            +{stats.newPatients} new this month
          </p>
        </div>

        {/* Active Treatments */}
        <div className="bg-white border border-green-100 rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Active Treatments</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.activeTreatments}
              </p>
            </div>
            <FiActivity className="text-green-500 text-3xl" />
          </div>
          <p className="text-sm text-gray-500 mt-1">Ongoing procedures</p>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-green-100 rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Revenue (Month)</p>
              <p className="text-3xl font-bold text-green-600">
                ₱{stats.revenueMonth.toLocaleString()}
              </p>
            </div>
            <FiDollarSign className="text-green-500 text-3xl" />
          </div>
          <p
            className={`text-sm mt-1 ${
              stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {stats.revenueGrowth >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(stats.revenueGrowth)}% vs last month
          </p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-green-100 rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-medium">Outstanding Balance</p>
              <p className="text-3xl font-bold text-red-500">
                ₱{stats.outstandingBalance.toLocaleString()}
              </p>
            </div>
            <FiTrendingUp className="text-red-400 text-3xl" />
          </div>
          <p className="text-sm text-gray-500 mt-1">Pending collections</p>
        </div>
      </div>

      {/* Analytics Split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Services */}
        <div className="bg-white border border-green-100 p-6 rounded-xl shadow hover:shadow-md transition">
          <h2 className="text-lg font-semibold text-[var(--theme-color)] mb-4 flex items-center gap-2">
            🪥 Top Services
          </h2>
          {topServices.length > 0 ? (
            <ul className="divide-y divide-green-100">
              {topServices.map((service, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center py-2 text-gray-700"
                >
                  <span>{service.name}</span>
                  <span className="text-green-600 font-medium">
                    {service.count} patients
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No data yet</p>
          )}
        </div>

        {/* Revenue Overview */}
        <div className="bg-white border border-green-100 p-6 rounded-xl shadow hover:shadow-md transition">
          <h2 className="text-lg font-semibold text-[var(--theme-color)] mb-4 flex items-center gap-2">
            💹 Revenue Overview
          </h2>
          <div className="h-40 flex items-center justify-center bg-green-50 rounded-lg border border-dashed border-green-200">
            <p className="text-gray-500">[Chart Placeholder]</p>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Track monthly revenue and compare against previous months.
          </p>
        </div>
      </div>
    </div>
  );
}
